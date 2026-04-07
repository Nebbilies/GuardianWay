import {Router} from "express";
import {busRouteController} from "../controllers/busRoute.controller";

const router = Router();

router.get('/', busRouteController.getAll);
router.post('/', busRouteController.create);
router.put('/:id', busRouteController.edit);
router.delete('/:id', busRouteController.delete);

export default router;