import {Router} from "express";
import {busController} from "../controllers/bus.controller";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

router.get('/', asyncHandler(busController.getAll));
router.post('/', asyncHandler(busController.create));
router.put('/:id', asyncHandler(busController.edit));
router.delete('/:id', asyncHandler(busController.delete));

export default router;