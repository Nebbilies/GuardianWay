import { Router } from "express";
import { busStopController } from "../controllers/busStop.controller";
import {asyncHandler} from "../utils/asyncHandler";
import {validate} from "../middlewares/validate.middleware";
import {
    busStopIdParamSchema,
    getAllBusStopsQuerySchema,
    upsertBusStopBodySchema,
} from "../validation/schemas/busStop.schemas";

const router = Router();

router.get("/", validate({query: getAllBusStopsQuerySchema}), asyncHandler(busStopController.getAll));
router.post("/", validate({body: upsertBusStopBodySchema}), asyncHandler(busStopController.create));
router.put(
    "/:id",
    validate({params: busStopIdParamSchema, body: upsertBusStopBodySchema}),
    asyncHandler(busStopController.edit),
);
router.delete("/:id", validate({params: busStopIdParamSchema}), asyncHandler(busStopController.delete));

export default router;
