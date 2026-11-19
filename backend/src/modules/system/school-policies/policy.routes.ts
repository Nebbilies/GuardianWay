import { Router } from "express";
import { list, create } from "./policy.controller";
export const policyRouter = Router();
policyRouter.get("/", list);
policyRouter.post("/", create);
