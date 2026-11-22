import { Router } from "express";
import {
    listStudents,
    getStudent,
    createStudent,
    changeStudent,
    createGuardian,
    closeGuardian,
    assignCard,
    revokeCard,
} from "./student.controller";
export const studentRouter = Router();
studentRouter.get("/", listStudents);
studentRouter.get("/export", listStudents);
studentRouter.get("/:id", getStudent);
studentRouter.post("/", createStudent);
studentRouter.patch("/:id", changeStudent("update"));
studentRouter.delete("/:id", changeStudent("delete"));
studentRouter.post("/:id/restore", changeStudent("restore"));
studentRouter.post("/:id/guardians", createGuardian);
studentRouter.post("/:id/guardians/:linkId/close", closeGuardian);
studentRouter.post("/:id/cards", assignCard);
studentRouter.post("/:id/cards/:cardId/revoke", revokeCard);
