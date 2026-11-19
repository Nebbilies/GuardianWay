import { createHash, randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transaction } from "../../../config/database";
import { AuthenticationError, InternalError } from "../../../errors/http-errors";
import { principalFromClaims, toWireRole, type Principal } from "../../../http/principal";
import { readAuthenticationAccount, readAuthenticationAccountById } from "../accounts";
import { readSchool } from "../schools";
import { recordAuthAudit, type RequestMetadata } from "../audit";
import { authRepository } from "./auth.repository";
import { loginBody, tokenClaims, type AuthSessionResult, type AuthUser } from "./auth.contracts";
import type { Database } from "../../../config/database";

export const ACCESS_COOKIE_NAME = "gw_access_token";
export const REFRESH_COOKIE_NAME = "gw_refresh_token";
export const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
type Account = NonNullable<Awaited<ReturnType<typeof readAuthenticationAccount>>>;

function secret(kind: "access" | "refresh") {
    const value = process.env[kind === "access" ? "JWT_ACCESS_SECRET" : "JWT_REFRESH_SECRET"];
    if (!value) throw new InternalError("Authentication is not configured");
    return value;
}
function hash(token: string) { return createHash("sha256").update(token).digest("hex"); }
function actorOf(account: Account): Principal {
    return principalFromClaims({ userId: account.id, role: account.role, schoolId: account.schoolId, contractVersion: 2 });
}
function userOf(account: Account): AuthUser {
    return { id: account.id, name: account.displayName, email: account.email, role: toWireRole(account.role), schoolId: account.schoolId };
}
function sessionFor(account: Account): AuthSessionResult {
    actorOf(account);
    const payload = { userId: account.id, role: account.role, schoolId: account.schoolId, contractVersion: 2 };
    return {
        accessToken: jwt.sign({ ...payload, tokenUse: "access" }, secret("access"), { algorithm: "HS256", expiresIn: ACCESS_TTL_SECONDS }),
        refreshToken: jwt.sign({ ...payload, tokenUse: "refresh" }, secret("refresh"), { algorithm: "HS256", expiresIn: REFRESH_TTL_SECONDS, jwtid: randomUUID() }),
        accessTokenExpiresIn: ACCESS_TTL_SECONDS, refreshTokenExpiresIn: REFRESH_TTL_SECONDS, user: userOf(account),
    };
}
function verify(token: string, kind: "access" | "refresh") {
    try {
        const parsed = tokenClaims.parse(jwt.verify(token, secret(kind), { algorithms: ["HS256"] }));
        if (parsed.tokenUse !== kind) throw new AuthenticationError();
        return parsed;
    } catch { throw new AuthenticationError("Invalid authentication session"); }
}
async function eligible(account: Account | null, database?: Database): Promise<Account | null> {
    if (!account || account.deletedAt || account.status !== "ACTIVE" || !account.activatedAt || !account.passwordHash) return null;
    try { actorOf(account); } catch { return null; }
    if (account.schoolId) {
        const school = await readSchool(account.schoolId, database);
        if (!school || school.deletedAt || school.status !== "ACTIVE") return null;
    }
    return account;
}
async function saveSession(database: Database, account: Account, session: AuthSessionResult, metadata: RequestMetadata) {
    await authRepository.create(database, {
        accountId: account.id, schoolId: account.schoolId, tokenHash: hash(session.refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000), userAgent: metadata.userAgent, ipAddress: metadata.ipAddress,
    });
}

export const authService = {
    verifyAccessToken(token: string): Principal { return principalFromClaims(verify(token, "access")); },
    async login(email: string, password: string, metadata: RequestMetadata = {}): Promise<AuthSessionResult> {
        const input = loginBody.parse({ email, password });
        const account = await eligible(await readAuthenticationAccount(input.email));
        if (!account || !await bcrypt.compare(input.password, account.passwordHash ?? "")) {
            await recordAuthAudit(null, { action: "auth.login_failed", subjectKind: "AUTH_ATTEMPT", subjectReference: hash(input.email) }, metadata);
            throw new AuthenticationError("Invalid email or password", "INVALID_CREDENTIALS");
        }
        const session = sessionFor(account);
        await transaction(database => saveSession(database, account, session, metadata));
        await recordAuthAudit(actorOf(account), { action: "auth.login", subjectKind: "USER_ACCOUNT", subjectReference: account.id }, metadata);
        return session;
    },
    async refresh(rawToken: string, metadata: RequestMetadata = {}): Promise<AuthSessionResult> {
        const claims = verify(rawToken, "refresh");
        const result = await transaction(async database => {
            const now = new Date();
            const stored = await authRepository.byHash(hash(rawToken), database);
            if (!stored || stored.accountId !== claims.userId || stored.revokedAt || stored.expiresAt <= now) throw new AuthenticationError("Invalid authentication session");
            const account = await eligible(await readAuthenticationAccountById(stored.accountId, database), database);
            if (!account || account.schoolId !== stored.schoolId) {
                await authRepository.revokeAccount(stored.accountId, database);
                return null;
            }
            if ((await authRepository.consume(database, stored.id, account.id, now)).count !== 1) throw new AuthenticationError("Refresh token has already been used");
            const session = sessionFor(account);
            await saveSession(database, account, session, metadata);
            return session;
        });
        if (!result) throw new AuthenticationError("Account or school is not active");
        return result;
    },
    async getCurrentUser(actor: Principal): Promise<AuthUser> {
        const account = await readAuthenticationAccountById(actor.accountId);
        if (!account || account.deletedAt || account.status !== "ACTIVE" || !account.activatedAt) {
            await authRepository.revokeAccount(actor.accountId);
            throw new AuthenticationError("Account is not active");
        }
        return userOf(account);
    },
    async logout(rawToken?: string) {
        if (rawToken) await authRepository.revokeHash(hash(rawToken));
        return { success: true };
    },
};
