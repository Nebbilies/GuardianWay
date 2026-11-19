import { Router } from "express";
import { list, get, create, update, cancel } from "./trip.controller";
export const tripRouter = Router();
tripRouter.get("/", list);
tripRouter.get("/:id", get);
tripRouter.post("/", create);
tripRouter.patch("/:id", update);
tripRouter.post("/:id/cancel", cancel);
