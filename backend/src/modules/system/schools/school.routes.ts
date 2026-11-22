import { Router } from "express";
import {
    listSchools,
    createSchool,
    changeSchool,
    schoolContext,
} from "./school.controller";
export const schoolRouter = Router();
export const schoolContextRouter = Router();
schoolContextRouter.get("/", schoolContext);
schoolRouter.get("/", listSchools);
schoolRouter.post("/", createSchool);
schoolRouter.patch("/:id", changeSchool("update"));
schoolRouter.delete("/:id", changeSchool("delete"));
schoolRouter.post("/:id/restore", changeSchool("restore"));
