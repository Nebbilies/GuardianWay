import { transaction, type Database } from "../../../config/database";
import {
    ConflictError,
    NotFoundError,
    ValidationError,
} from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import type { ListQuery } from "../../../http/contracts/pagination";
import { recordAudit, type RequestMetadata } from "../../system/audit";
import {
    requireLinkedAccount,
    prepareSchoolAccount,
    deliverAccountInvitation,
} from "../../system/accounts";
import { driverRepository } from "./driver.repository";
import { driverBody, driverPatch, driverOnboarding } from "./driver.contracts";
export async function requireDriver(
    schoolId: string,
    id: string,
    database: Database,
) {
    const driver = await driverRepository.find(schoolId, id, database);
    if (!driver || driver.deletedAt || driver.status !== "AVAILABLE") {
        throw new ValidationError(
            "Driver is unavailable or does not belong to this school",
        );
    }
    if (!driver.accountId) {
        throw new ValidationError(
            "Assign a driver account before scheduling this driver",
        );
    }
    await requireLinkedAccount(database, schoolId, driver.accountId, "DRIVER");
    return driver;
}
export const driverService = {
    list(actor: Principal, query: ListQuery, exportAll = false) {
        return driverRepository.list(
            requireSchoolAdmin(actor).schoolId,
            query,
            exportAll,
        );
    },
    async get(actor: Principal, id: string) {
        const row = await driverRepository.find(
            requireSchoolAdmin(actor).schoolId,
            id,
        );
        if (!row || row.deletedAt) {
            throw new NotFoundError("Driver not found");
        }
        return row;
    },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = driverBody.parse(input);
        return transaction(async (database) => {
            if (data.accountId) {
                await requireLinkedAccount(
                    database,
                    schoolId,
                    data.accountId,
                    "DRIVER",
                );
            }
            const row = await driverRepository.create(database, {
                ...data,
                schoolId,
            });
            await recordAudit(
                database,
                actor,
                {
                    action: "driver.created",
                    subjectKind: "DRIVER_PROFILE",
                    subjectReference: row.id,
                    after: row,
                },
                metadata,
            );
            return row;
        });
    },
    async change(
        actor: Principal,
        id: string,
        input: unknown,
        operation: "update" | "delete" | "restore",
        metadata: RequestMetadata,
    ) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = operation === "update" ? driverPatch.parse(input) : {};
        return transaction(async (database) => {
            const before = await driverRepository.find(schoolId, id, database);
            if (
                !before ||
                (operation === "restore" ? !before.deletedAt : before.deletedAt)
            ) {
                throw new NotFoundError("Driver not found");
            }
            const accountId =
                data.accountId === undefined
                    ? before.accountId
                    : data.accountId;
            if (
                accountId &&
                (operation === "restore" || data.accountId !== undefined)
            ) {
                await requireLinkedAccount(
                    database,
                    schoolId,
                    accountId,
                    "DRIVER",
                );
            }
            const after = await driverRepository.update(
                database,
                schoolId,
                id,
                {
                    ...data,
                    ...(operation === "delete"
                        ? { deletedAt: new Date() }
                        : operation === "restore"
                          ? { deletedAt: null }
                          : {}),
                },
            );
            await recordAudit(
                database,
                actor,
                {
                    action: "driver." + operation,
                    subjectKind: "DRIVER_PROFILE",
                    subjectReference: id,
                    before,
                    after,
                },
                metadata,
            );
            return after;
        });
    },
    async onboard(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor),
            data = driverOnboarding.parse(input);
        const result = await transaction(async (database) => {
            const invitation = await prepareSchoolAccount(
                database,
                actor,
                schoolId,
                { ...data.account, role: "DRIVER" },
                metadata,
            );
            let driver;
            if (data.driverId) {
                driver = await driverRepository.link(
                    database,
                    schoolId,
                    data.driverId,
                    invitation.account.id,
                );
                if (!driver) {
                    throw new ConflictError(
                        "Driver profile is unavailable or already linked to an account",
                    );
                }
            } else if (data.driver) {
                driver = await driverRepository.create(database, {
                    ...data.driver,
                    schoolId,
                    accountId: invitation.account.id,
                });
            } else {
                throw new ValidationError("Driver profile is required");
            }
            await recordAudit(
                database,
                actor,
                {
                    action: "driver.onboarded",
                    subjectKind: "DRIVER_PROFILE",
                    subjectReference: driver.id,
                    after: driver,
                },
                metadata,
            );
            return { ...invitation, driver };
        });
        return deliverAccountInvitation(result);
    },
};
