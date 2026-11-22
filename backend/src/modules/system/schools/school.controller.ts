import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { listQuerySchema } from "../../../http/contracts/pagination";
import { schoolService } from "./school.service";
export async function schoolContext(req: Request, res: Response) {
    res.json(await schoolService.context(authenticatedActor(req)));
}

export async function listSchools(req: Request, res: Response) {
    res.json(
        await schoolService.list(
            authenticatedActor(req),
            listQuerySchema.parse(req.query),
        ),
    );
}
export async function createSchool(req: Request, res: Response) {
    res.status(201).json(
        await schoolService.create(
            authenticatedActor(req),
            req.body,
            requestMetadata(req),
        ),
    );
}
export function changeSchool(operation: "update" | "delete" | "restore") {
    return async (req: Request, res: Response) => {
        const { id } = idParams.parse(req.params);
        res.json(
            await schoolService.change(
                authenticatedActor(req),
                id,
                req.body,
                operation,
                requestMetadata(req),
            ),
        );
    };
}
