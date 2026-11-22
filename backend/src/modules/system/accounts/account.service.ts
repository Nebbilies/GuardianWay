import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { transaction, type Database } from "../../../config/database";
import {
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    ValidationError,
} from "../../../errors/http-errors";
import {
    requirePlatform,
    requireSchoolAdmin,
    fromWireRole,
    toWireRole,
    principalFromClaims,
    type Principal,
} from "../../../http/principal";
import { recordAudit, type RequestMetadata } from "../audit";
import { readSchool } from "../schools";
import transporter from "../../../utils/mailer";
import { accountRepository } from "./account.repository";
import {
    accountBody,
    accountPatch,
    accountViewSchema,
    type CreateAccount,
} from "./account.contracts";
import type { ListQuery } from "../../../http/contracts/pagination";
import type { WireRole } from "../../../http/principal";

const INVITE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const PASSWORD_ROUNDS = 10;
type AccountRow = NonNullable<
    Awaited<ReturnType<typeof accountRepository.find>>
>;

export function accountView(row: AccountRow) {
    return accountViewSchema.parse({
        ...row,
        role: toWireRole(row.role),
        activatedAt: row.activatedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        deletedAt: row.deletedAt?.toISOString() ?? null,
    });
}

export async function readAuthenticationAccount(
    email: string,
    database?: Database,
) {
    return accountRepository.credentials(email.trim().toLowerCase(), database);
}
export async function readAuthenticationAccountById(
    id: string,
    database?: Database,
) {
    return accountRepository.authById(id, database);
}

export function lockAuthenticationAccountById(database: Database, id: string) {
    return accountRepository.lockForAuthentication(database, id);
}
export function revokeAuthenticationSessions(id: string, database?: Database) {
    return accountRepository.revokeAuthenticationSessions(id, database);
}

export async function requireLinkedAccount(
    database: Database,
    schoolId: string,
    id: string,
    role: "PARENT" | "DRIVER",
) {
    const account = await accountRepository.lockAndFind(database, schoolId, id);
    if (
        !account ||
        account.deletedAt ||
        account.role !== role ||
        account.status === "LOCKED"
    ) {
        throw new ValidationError(
            "Linked account is invalid or does not belong to this school",
        );
    }
    return account;
}

async function activeSchool(schoolId: string, database: Database) {
    const school = await readSchool(schoolId, database);
    if (!school || school.deletedAt || school.status !== "ACTIVE") {
        throw new ConflictError("School is not active");
    }
    return school;
}

function authorizeTarget(actor: Principal, schoolId: string, role?: string) {
    if (actor.kind === "school") {
        requireSchoolAdmin(actor);
        if (actor.schoolId !== schoolId) {
            throw new NotFoundError();
        }
    } else {
        requirePlatform(actor);
        if (role && role !== "SCHOOL_ADMIN") {
            throw new AuthorizationError(
                "Only school administrator accounts can be managed here",
            );
        }
    }
}

async function issue(
    database: Database,
    actor: Principal,
    account: AccountRow,
    metadata: RequestMetadata,
) {
    if (!account.schoolId) {
        throw new ValidationError(
            "School invitations cannot be issued to platform accounts",
        );
    }
    const baseUrl = process.env.WEB_BASE_URL;
    if (!baseUrl) {
        throw new ValidationError("Web application URL is not configured");
    }
    const rawToken = randomBytes(32).toString("hex");
    const now = new Date();
    await accountRepository.revokeInvites(database, account.id, now);
    const invite = await accountRepository.createInvite(database, {
        schoolId: account.schoolId,
        accountId: account.id,
        invitedById: actor.accountId,
        tokenHash: createHash("sha256").update(rawToken).digest("hex"),
        issuedAt: now,
        expiresAt: new Date(now.getTime() + INVITE_TTL_MS),
        status: "ISSUED",
    });
    await recordAudit(
        database,
        actor,
        {
            action: "invite.issued",
            subjectKind: "USER_INVITE",
            subjectReference: invite.id,
            schoolId: account.schoolId,
            after: { accountId: account.id, expiresAt: invite.expiresAt },
        },
        metadata,
    );
    const url = new URL(baseUrl.replace(/\/$/, "") + "/setup-password");
    url.searchParams.set("token", rawToken);
    return {
        inviteLink: url.toString(),
        expiresAt: invite.expiresAt.toISOString(),
    };
}

async function deliver(
    email: string,
    inviteLink: string,
): Promise<"SENT" | "FAILED" | "NOT_CONFIGURED"> {
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        return "NOT_CONFIGURED";
    }
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: "[GuardianWay] Thiết lập mật khẩu",
            text:
                "Thiết lập mật khẩu tại " +
                inviteLink +
                ". Liên kết có hiệu lực trong 3 ngày.",
        });
        return "SENT";
    } catch {
        return "FAILED";
    }
}

/** Called by accounts and driver onboarding inside their owning transaction. */
export async function prepareSchoolAccount(
    database: Database,
    actor: Principal,
    schoolId: string,
    input: CreateAccount,
    metadata: RequestMetadata,
) {
    const role = fromWireRole(input.role);
    authorizeTarget(actor, schoolId, role);
    if (role === "PLATFORM_ADMIN") {
        throw new AuthorizationError(
            "Platform accounts cannot be created through school invitations",
        );
    }
    await activeSchool(schoolId, database);
    const account = await accountRepository.create(database, {
        schoolId,
        displayName: input.displayName,
        email: input.email,
        phone: input.phone,
        role,
        status: "INVITED",
        passwordHash: null,
    });
    await recordAudit(
        database,
        actor,
        {
            action: "account.created",
            subjectKind: "USER_ACCOUNT",
            subjectReference: account.id,
            schoolId,
            after: account,
        },
        metadata,
    );
    const invitation = await issue(database, actor, account, metadata);
    return { account: accountView(account), ...invitation };
}

export async function deliverAccountInvitation<
    T extends { account: { email: string }; inviteLink: string },
>(result: T) {
    return {
        ...result,
        deliveryStatus: await deliver(result.account.email, result.inviteLink),
    };
}

export const accountService = {
    async resendByEmail(
        actor: Principal,
        email: string,
        metadata: RequestMetadata,
    ) {
        if (actor.kind === "school") {
            requireSchoolAdmin(actor);
        } else {
            requirePlatform(actor);
        }
        const account = await accountRepository.emailTarget(
            email,
            actor.schoolId ?? undefined,
        );
        if (!account?.schoolId) {
            throw new NotFoundError("Account not found");
        }
        return accountService.resend(
            actor,
            account.schoolId,
            account.id,
            metadata,
        );
    },
    async list(
        actor: Principal,
        schoolId: string,
        query: ListQuery & { role?: WireRole },
        exportAll = false,
    ) {
        authorizeTarget(actor, schoolId);
        const page = await accountRepository.list(
            schoolId,
            query,
            actor.kind === "platform",
            exportAll,
        );
        return { ...page, data: page.data.map(accountView) };
    },
    async get(actor: Principal, schoolId: string, id: string) {
        const row = await accountRepository.find(schoolId, id);
        if (!row || row.deletedAt) {
            throw new NotFoundError("Account not found");
        }
        authorizeTarget(actor, schoolId, row.role);
        return accountView(row);
    },
    async create(
        actor: Principal,
        schoolId: string,
        input: unknown,
        metadata: RequestMetadata,
    ) {
        const data = accountBody.parse(input);
        if (data.schoolId && data.schoolId !== schoolId) {
            throw new AuthorizationError("School scope cannot be changed");
        }
        const result = await transaction((database) =>
            prepareSchoolAccount(database, actor, schoolId, data, metadata),
        );
        return deliverAccountInvitation(result);
    },
    async change(
        actor: Principal,
        schoolId: string,
        id: string,
        input: unknown,
        operation: "update" | "delete" | "restore",
        metadata: RequestMetadata,
    ) {
        const data = operation === "update" ? accountPatch.parse(input) : {};
        return transaction(async (database) => {
            const before = await accountRepository.lockAndFind(
                database,
                schoolId,
                id,
            );
            if (
                !before ||
                (operation === "restore" ? !before.deletedAt : before.deletedAt)
            ) {
                throw new NotFoundError("Account not found");
            }
            authorizeTarget(actor, schoolId, before.role);
            const role = data.role ? fromWireRole(data.role) : before.role;
            authorizeTarget(actor, schoolId, role);
            if (role === "PLATFORM_ADMIN") {
                throw new AuthorizationError();
            }
            if (
                role !== before.role &&
                (await accountRepository.hasRoleLinks(
                    database,
                    schoolId,
                    id,
                    role,
                ))
            ) {
                throw new ConflictError(
                    "Resolve guardian or driver links before changing the account role",
                    "ACCOUNT_HAS_ROLE_LINKS",
                );
            }
            if (
                (data.status === "ACTIVE" && !before.activatedAt) ||
                (data.status === "INVITED" && before.activatedAt)
            ) {
                throw new ValidationError(
                    "Account activation must be handled through an invitation",
                );
            }
            if (
                (data.email && data.email !== before.email) ||
                operation === "delete" ||
                data.status === "LOCKED"
            ) {
                await accountRepository.revokeInvites(database, id, new Date());
            }
            const after = await accountRepository.update(
                database,
                schoolId,
                id,
                {
                    ...data,
                    role,
                    ...(operation === "delete"
                        ? { deletedAt: new Date() }
                        : operation === "restore"
                          ? { deletedAt: null }
                          : {}),
                },
            );
            if (!after) {
                throw new NotFoundError();
            }
            await recordAudit(
                database,
                actor,
                {
                    action: "account." + operation,
                    subjectKind: "USER_ACCOUNT",
                    subjectReference: id,
                    schoolId,
                    before,
                    after,
                },
                metadata,
            );
            return accountView(after);
        });
    },
    async resend(
        actor: Principal,
        schoolId: string,
        id: string,
        metadata: RequestMetadata,
    ) {
        const result = await transaction(async (database) => {
            const account = await accountRepository.lockAndFind(
                database,
                schoolId,
                id,
            );
            if (!account || account.deletedAt) {
                throw new NotFoundError("Account not found");
            }
            authorizeTarget(actor, schoolId, account.role);
            if (account.status === "LOCKED") {
                throw new ConflictError(
                    "Unlock the account before issuing an invitation",
                );
            }
            await activeSchool(schoolId, database);
            return {
                account: accountView(account),
                ...(await issue(database, actor, account, metadata)),
            };
        });
        return deliverAccountInvitation(result);
    },
    async accept(token: string, password: string, metadata: RequestMetadata) {
        const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS);
        const hash = createHash("sha256").update(token).digest("hex");
        return transaction(async (database) => {
            const now = new Date();
            const invite = await accountRepository.invite(hash, database);
            if (
                !invite ||
                invite.status !== "ISSUED" ||
                invite.expiresAt <= now ||
                invite.revokedAt ||
                invite.acceptedAt
            ) {
                throw new ValidationError(
                    "Invitation link is invalid or expired",
                    undefined,
                    "INVITATION_INVALID",
                );
            }
            const account = await accountRepository.lockAndFind(
                database,
                invite.schoolId,
                invite.accountId,
            );
            if (!account || account.deletedAt || account.status === "LOCKED") {
                throw new AuthenticationError("Account is not active");
            }
            await activeSchool(invite.schoolId, database);
            if (
                (
                    await accountRepository.consumeInvite(
                        database,
                        invite.id,
                        now,
                    )
                ).count !== 1
            ) {
                throw new ConflictError(
                    "Invitation has already been used",
                    "INVITATION_INVALID",
                );
            }
            await accountRepository.update(
                database,
                invite.schoolId,
                account.id,
                {
                    passwordHash,
                    status: "ACTIVE",
                    activatedAt: account.activatedAt ?? now,
                },
            );
            if (account.activatedAt) {
                await revokeAuthenticationSessions(account.id, database);
            }
            const actor = principalFromClaims({
                userId: account.id,
                schoolId: invite.schoolId,
                role: account.role,
                contractVersion: 2,
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "account.activated",
                    subjectKind: "USER_ACCOUNT",
                    subjectReference: account.id,
                    after: { activatedAt: now },
                },
                metadata,
            );
            return { success: true };
        });
    },
};
