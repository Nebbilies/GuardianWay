import type { Request, Response } from "express";
import { authenticatedActor } from "../../../middlewares/auth.middleware";
import { requestMetadata } from "../../../http/request";
import { idParams } from "../../../http/normalization";
import { scheduleQuery } from "./schedule.contracts";
import { scheduleService } from "./schedule.service";
export async function list(req: Request, res: Response) {
    res.json(
        await scheduleService.list(
            authenticatedActor(req),
            scheduleQuery.parse(req.query),
        ),
    );
}
export async function get(req: Request, res: Response) {
    res.json(
        await scheduleService.get(
            authenticatedActor(req),
            idParams.parse(req.params).id,
        ),
    );
}
export async function create(req: Request, res: Response) {
    res.status(201).json(
        await scheduleService.create(
            authenticatedActor(req),
            req.body,
            requestMetadata(req),
        ),
    );
}
export async function revise(req: Request, res: Response) {
    res.status(201).json(
        await scheduleService.create(
            authenticatedActor(req),
            req.body,
            requestMetadata(req),
            idParams.parse(req.params).id,
        ),
    );
}
export async function update(req: Request, res: Response) {
    res.json(
        await scheduleService.update(
            authenticatedActor(req),
            idParams.parse(req.params).id,
            req.body,
            requestMetadata(req),
        ),
    );
}
export function transition(operation: "activate" | "deactivate") {
    return async (req: Request, res: Response) => {
        res.json(
            await scheduleService.transition(
                authenticatedActor(req),
                idParams.parse(req.params).id,
                operation,
                requestMetadata(req),
            ),
        );
    };
}
