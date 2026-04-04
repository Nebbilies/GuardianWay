import { Router } from "express";
import { busStopController } from "../controllers/busStop.controller";

const router = Router();

router.get("/", busStopController.getAll);
router.post("/", busStopController.create);
router.put("/:id", busStopController.edit);

export default router;

