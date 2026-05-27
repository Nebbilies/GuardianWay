import {Router} from "express";
import {busTripController} from "../controllers/busTrip.controller";
import {asyncHandler} from "../utils/asyncHandler";
import {validate} from "../middlewares/validate.middleware";
import {
    busTripIdParamSchema,
    getAllBusTripsQuerySchema,
    upsertBusTripBodySchema,
} from "../validation/schemas/busTrip.schemas";

const router = Router();

router.get("/", validate({query: getAllBusTripsQuerySchema}), asyncHandler(busTripController.getAll));
router.post("/", validate({body: upsertBusTripBodySchema}), asyncHandler(busTripController.create));
router.put(
    "/:id",
    validate({params: busTripIdParamSchema, body: upsertBusTripBodySchema}),
    asyncHandler(busTripController.edit),
);
router.delete("/:id", validate({params: busTripIdParamSchema}), asyncHandler(busTripController.delete));

export default router;
