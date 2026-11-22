import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transaction } from "../../../config/database";
import {
    AuthenticationError,
    InternalError,
} from "../../../errors/http-errors";
import {
    principalFromClaims,
    toWireRole,
    type Principal,
} from "../../../http/principal";
import {
    readAuthenticationAccount,
    readAuthenticationAccountById,
    lockAuthenticationAccountById,
    revokeAuthenticationSessions,
} from "../accounts";
import { readSchool } from "../schools";
import { recordAuthAudit, type RequestMetadata } from "../audit";
import { authRepository } from "./auth.repository";
import {
    loginBody,
    tokenClaims,
    type AuthSessionResult,
    type AuthUser,
} from "./auth.contracts";
import type { Database } from "../../../config/database";

export const ACCESS_COOKIE_NAME = "gw_access_token";
export const REFRESH_COOKIE_NAME = "gw_refresh_token";
export const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
type Account = NonNullable<
    Awaited<ReturnType<typeof readAuthenticationAccount>>
>;

function secret(kind: "access" | "refresh") {
    const value =
        process.env[
            kind === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET"
        ];
    if (!value) {
        throw new InternalError("Authentication is not configured");
    }
    return value;
}
function hash(token: string) {
    return createHash("sha256").update(token).digest("hex");
}
function actorOf(account: Account): Principal {
    return principalFromClaims({
        userId: account.id,
        role: account.role,
        schoolId: account.schoolId,
        contractVersion: 2,
    });
}
function userOf(account: Account): AuthUser {
    return {
        id: account.id,
        name: account.displayName,
        email: account.email,
        role: toWireRole(account.role),
        schoolId: account.schoolId,
    };
}
function sessionFor(account: Account, sessionId: string): AuthSessionResult {
    actorOf(account);
    const payload = {
        userId: account.id,
        role: account.role,
        schoolId: account.schoolId,
        contractVersion: 2,
    };
    return {
        accessToken: jwt.sign(
            { ...payload, tokenUse: "access" },
            secret("access"),
            { algorithm: "HS256", expiresIn: ACCESS_TTL_SECONDS },
        ),
        refreshToken: jwt.sign(
            { ...payload, tokenUse: "refresh", sid: sessionId },
            secret("refresh"),
            {
                algorithm: "HS256",
                expiresIn: REFRESH_TTL_SECONDS,
                jwtid: randomUUID(),
            },
        ),
        accessTokenExpiresIn: ACCESS_TTL_SECONDS,
        refreshTokenExpiresIn: REFRESH_TTL_SECONDS,
        user: userOf(account),
    };
}
function verify(token: string, kind: "access" | "refresh") {
    try {
        const parsed = tokenClaims.parse(
            jwt.verify(token, secret(kind), { algorithms: ["HS256"] }),
        );
        if (parsed.tokenUse !== kind) {
            throw new AuthenticationError();
        }
        return parsed;
    } catch {
        throw new AuthenticationError("Invalid authentication session");
    }
}
async function eligible(
    account: Account | null,
    database?: Database,
): Promise<Account | null> {
    if (
        !account ||
        account.deletedAt ||
        account.status !== "ACTIVE" ||
        !account.activatedAt ||
        !account.passwordHash
    ) {
        return null;
    }
    try {
        actorOf(account);
    } catch {
        return null;
    }
    if (account.schoolId) {
        const school = await readSchool(account.schoolId, database);
        if (!school || school.deletedAt || school.status !== "ACTIVE") {
            return null;
        }
    }
    return account;
}
async function saveSession(
    database: Database,
    sessionId: string,
    account: Account,
    session: AuthSessionResult,
    metadata: RequestMetadata,
) {
    await authRepository.create(database, {
        id: sessionId,
        accountId: account.id,
        schoolId: account.schoolId,
        tokenHash: hash(session.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
    });
}

export const authService = {
    verifyAccessToken(token: string): Principal {
        return principalFromClaims(verify(token, "access"));
    },
    async login(
        email: string,
        password: string,
        metadata: RequestMetadata = {},
    ): Promise<AuthSessionResult> {
        const input = loginBody.parse({ email, password });
        const account = await eligible(
            await readAuthenticationAccount(input.email),
        );
        const result =
            account &&
            (await bcrypt.compare(input.password, account.passwordHash ?? ""))
                ? await transaction(async (database) => {
                      const current = await eligible(
                          await lockAuthenticationAccountById(
                              database,
                              account.id,
                          ),
                          database,
                      );
                      if (
                          !current ||
                          current.passwordHash !== account.passwordHash ||
                          current.email !== input.email
                      ) {
                          return null;
                      }
                      const sessionId = randomUUID();
                      const session = sessionFor(current, sessionId);
                      await saveSession(
                          database,
                          sessionId,
                          current,
                          session,
                          metadata,
                      );
                      return { session, actor: actorOf(current) };
                  })
                : null;
        if (!result) {
            await recordAuthAudit(
                null,
                {
                    action: "auth.login_failed",
                    subjectKind: "AUTH_ATTEMPT",
                    subjectReference: hash(input.email),
                },
                metadata,
            );
            throw new AuthenticationError(
                "Invalid email or password",
                "INVALID_CREDENTIALS",
            );
        }
        await recordAuthAudit(
            result.actor,
            {
                action: "auth.login",
                subjectKind: "USER_ACCOUNT",
                subjectReference: result.actor.accountId,
            },
            metadata,
        );
        return result.session;
    },
    async refresh(
        rawToken: string,
        metadata: RequestMetadata = {},
    ): Promise<AuthSessionResult> {
        const claims = verify(rawToken, "refresh");
        const result = await transaction(async (database) => {
            const now = new Date();
            const stored = await authRepository.byHash(
                hash(rawToken),
                database,
            );
            if (
                !stored ||
                stored.accountId !== claims.userId ||
                stored.revokedAt ||
                stored.expiresAt <= now
            ) {
                throw new AuthenticationError("Invalid authentication session");
            }
            const account = await eligible(
                await readAuthenticationAccountById(stored.accountId, database),
                database,
            );
            if (!account || account.schoolId !== stored.schoolId) {
                await revokeAuthenticationSessions(stored.accountId, database);
                return null;
            }
            const session = sessionFor(account, stored.id);
            const rotation = await authRepository.rotate(
                database,
                stored.id,
                stored.tokenHash,
                now,
                {
                    tokenHash: hash(session.refreshToken),
                    expiresAt: new Date(
                        now.getTime() + REFRESH_TTL_SECONDS * 1000,
                    ),
                    userAgent: metadata.userAgent,
                    ipAddress: metadata.ipAddress,
                },
            );
            if (!rotation.count) {
                throw new AuthenticationError(
                    "Refresh token has already been used",
                );
            }
            return session;
        });
        if (!result) {
            throw new AuthenticationError("Account or school is not active");
        }
        return result;
    },
    async getCurrentUser(actor: Principal): Promise<AuthUser> {
        const account = await readAuthenticationAccountById(actor.accountId);
        if (
            !account ||
            account.deletedAt ||
            account.status !== "ACTIVE" ||
            !account.activatedAt
        ) {
            await revokeAuthenticationSessions(actor.accountId);
            throw new AuthenticationError("Account is not active");
        }
        return userOf(account);
    },
    async logout(rawToken?: string) {
        if (rawToken) {
            let claims;
            try {
                claims = verify(rawToken, "refresh");
            } catch (error) {
                if (!(error instanceof AuthenticationError)) {
                    throw error;
                }
            }
            if (claims?.sid) {
                await authRepository.revokeSession(claims.sid, claims.userId);
            } else {
                await authRepository.revokeHash(hash(rawToken));
            }
        }
        return { success: true };
    },
};
