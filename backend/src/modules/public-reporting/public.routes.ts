import { Router } from "express";
import { landingProof } from "./public.controller";
export const publicRouter = Router();
publicRouter.get("/landing-proof", landingProof);
