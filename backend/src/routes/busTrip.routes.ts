import {Router} from "express";
import {busTripController} from "../controllers/busTrip.controller";

const router = Router();

router.get("/", busTripController.getAll);
router.post("/", busTripController.create);
router.put("/:id", busTripController.edit);
router.delete("/:id", busTripController.delete);

export default router;
