import {Router} from "express";
import {busController} from "../controllers/bus.controller";
import {asyncHandler} from "../utils/asyncHandler";
import {validate} from "../middlewares/validate.middleware";
import {
    busIdParamSchema,
    createBusBodySchema,
    getAllBusesQuerySchema,
    updateBusBodySchema,
} from "../validation/schemas/bus.schemas";

const router = Router();

router.get('/', validate({query: getAllBusesQuerySchema}), asyncHandler(busController.getAll));
router.post('/', validate({body: createBusBodySchema}), asyncHandler(busController.create));
router.put(
    '/:id',
    validate({params: busIdParamSchema, body: updateBusBodySchema}),
    asyncHandler(busController.edit),
);
router.delete('/:id', validate({params: busIdParamSchema}), asyncHandler(busController.delete));

export default router;
