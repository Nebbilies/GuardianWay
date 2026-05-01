import { Router } from "express";
import { busStopController } from "../controllers/busStop.controller";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(busStopController.getAll));
router.post("/", asyncHandler(busStopController.create));
router.put("/:id", asyncHandler(busStopController.edit));
router.delete("/:id", asyncHandler(busStopController.delete));

export default router;

