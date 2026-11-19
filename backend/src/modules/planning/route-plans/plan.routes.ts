import { Router } from "express";
import { list, get, create, revise, update, approve } from "./plan.controller";
export const planRouter = Router();
planRouter.get("/", list);
planRouter.get("/:id", get);
planRouter.post("/", create);
planRouter.put("/:id", update);
planRouter.post("/:id/versions", revise);
planRouter.post("/:id/approve", approve);
