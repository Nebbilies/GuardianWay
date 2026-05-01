import {Router} from "express";
import {busTripController} from "../controllers/busTrip.controller";
import {asyncHandler} from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(busTripController.getAll));
router.post("/", asyncHandler(busTripController.create));
router.put("/:id", asyncHandler(busTripController.edit));
router.delete("/:id", asyncHandler(busTripController.delete));

export default router;
