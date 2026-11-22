export {
    accountService,
    readAuthenticationAccount,
    readAuthenticationAccountById,
    lockAuthenticationAccountById,
    revokeAuthenticationSessions,
    requireLinkedAccount,
    prepareSchoolAccount,
    deliverAccountInvitation,
} from "./account.service";
export type { CreateAccount } from "./account.contracts";
export { activationBody, invitationBody } from "./account.contracts";
export {
    accountBody,
    accountPatch,
    accountQuery,
    accountViewSchema,
    invitationResponseSchema,
} from "./account.contracts";
