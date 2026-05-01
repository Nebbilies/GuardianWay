import {Router} from "express";
import {busRouteController} from "../controllers/busRoute.controller";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

router.get('/', asyncHandler(busRouteController.getAll));
router.post('/', asyncHandler(busRouteController.create));
router.put('/:id', asyncHandler(busRouteController.edit));
router.delete('/:id', asyncHandler(busRouteController.delete));

export default router;