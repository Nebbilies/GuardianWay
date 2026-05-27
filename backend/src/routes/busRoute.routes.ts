import {Router} from "express";
import {busRouteController} from "../controllers/busRoute.controller";
import {asyncHandler} from "../utils/asyncHandler";
import {validate} from "../middlewares/validate.middleware";
import {
    busRouteIdParamSchema,
    getAllBusRoutesQuerySchema,
    upsertBusRouteBodySchema,
} from "../validation/schemas/busRoute.schemas";

const router = Router();

router.get('/', validate({query: getAllBusRoutesQuerySchema}), asyncHandler(busRouteController.getAll));
router.post('/', validate({body: upsertBusRouteBodySchema}), asyncHandler(busRouteController.create));
router.put(
    '/:id',
    validate({params: busRouteIdParamSchema, body: upsertBusRouteBodySchema}),
    asyncHandler(busRouteController.edit),
);
router.delete('/:id', validate({params: busRouteIdParamSchema}), asyncHandler(busRouteController.delete));

export default router;
