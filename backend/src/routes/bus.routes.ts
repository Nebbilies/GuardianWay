import {Router} from "express";
import {busController} from "../controllers/bus.controller";

const router = Router();

router.get('/', busController.getAll);

export default router;