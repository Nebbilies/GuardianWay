import { transaction, type Database } from "../../../config/database";
import { ConflictError, ValidationError } from "../../../errors/http-errors";
import { requireSchoolAdmin, type Principal } from "../../../http/principal";
import { timeValue, timeText } from "../../../utils/school-time";
import { recordAudit, type RequestMetadata } from "../audit";
import { policyBody } from "./policy.contracts";
import { policyRepository } from "./policy.repository";
export async function requirePolicy(schoolId: string, id: string, database?: Database) {
    if (database) await policyRepository.lock(database, schoolId, id, false);
    const policy = await policyRepository.find(schoolId, id, database);
    if (!policy || policy.status !== "APPROVED") throw new ValidationError("Approved school policy not found");
    return policy;
}
function view(row: Awaited<ReturnType<typeof requirePolicy>>) { return { ...row, pickupArrivalTime: row.pickupArrivalTime ? timeText(row.pickupArrivalTime) : null, dropoffDepartureTime: row.dropoffDepartureTime ? timeText(row.dropoffDepartureTime) : null }; }
export const policyService = {
    async list(actor: Principal) { return (await policyRepository.list(requireSchoolAdmin(actor).schoolId)).map(view); },
    async create(actor: Principal, input: unknown, metadata: RequestMetadata) {
        const { schoolId } = requireSchoolAdmin(actor), data = policyBody.parse(input);
        return transaction(async database => {
            const previous = await policyRepository.latest(database, schoolId), effectiveFrom = new Date(data.effectiveFrom);
            if (previous && effectiveFrom <= previous.effectiveFrom) throw new ConflictError("A new policy version must start after its previous version");
            if (previous && (!previous.effectiveTo || previous.effectiveTo > effectiveFrom)) {
                await policyRepository.lock(database, schoolId, previous.id, true);
                if (await policyRepository.affectedTrips(database, schoolId, previous.id, effectiveFrom)) throw new ConflictError("Policy change would invalidate a prepared trip");
                await policyRepository.close(database, schoolId, previous.id, effectiveFrom);
            }
            const row = await policyRepository.create(database, { ...data, schoolId, versionNo: (previous?.versionNo ?? 0) + 1, previousVersionId: previous?.id, effectiveFrom,
                effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null, pickupArrivalTime: data.pickupArrivalTime ? timeValue(data.pickupArrivalTime) : null, dropoffDepartureTime: data.dropoffDepartureTime ? timeValue(data.dropoffDepartureTime) : null,
                status: "APPROVED", approvedAt: new Date(), approvedById: actor.accountId });
            await recordAudit(database, actor, { action: "policy.approved", subjectKind: "SCHOOL_POLICY_VERSION", subjectReference: row.id, after: row }, metadata);
            return view(row);
        });
    },
};
