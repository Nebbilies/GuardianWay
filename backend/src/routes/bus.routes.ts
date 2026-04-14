import {Router} from "express";
import {busController} from "../controllers/bus.controller";

const router = Router();

router.get('/', busController.getAll);
router.post('/', busController.create);
router.put('/:id', busController.edit);
router.delete('/:id', busController.delete);

export default router;