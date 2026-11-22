import { Router } from "express";
import {
    listAccounts,
    getAccount,
    createAccount,
    changeAccount,
    resendInvite,
} from "./account.controller";
export function accountRouter() {
    const router = Router({ mergeParams: true });
    router.get("/", listAccounts);
    router.get("/export", listAccounts);
    router.get("/:id", getAccount);
    router.post("/", createAccount);
    router.patch("/:id", changeAccount("update"));
    router.delete("/:id", changeAccount("delete"));
    router.post("/:id/restore", changeAccount("restore"));
    router.post("/:id/invite", resendInvite);
    return router;
}
