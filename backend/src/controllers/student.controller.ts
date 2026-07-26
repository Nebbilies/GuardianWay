import {Request, Response} from "express";
import {studentService} from "../services/student.service";
import {GetAllStudentsParams} from "../repositories/student.repository";

class StudentController {
    async getAll(req: Request, res: Response) {
        const {search, studentClass, parentId, deleted, page, limit, sort} = req.query;
        const params: GetAllStudentsParams = {};

        if (typeof search === "string") params.search = search;
        if (typeof studentClass === "string") params.studentClass = studentClass;
        if (typeof parentId === "string") params.parentId = parentId;
        if (typeof deleted === "string") params.deleted = deleted;
        if (typeof page === "string") params.page = parseInt(page, 10);
        if (typeof limit === "string") params.limit = parseInt(limit, 10);
        if (typeof sort === "string") params.sort = sort;

        const students = await studentService.getAll(params);
        res.json(students);
    }

    async getById(req: Request, res: Response) {
        const student = await studentService.getById(String(req.params.id));
        res.json(student);
    }

    async create(req: Request, res: Response) {
        const student = await studentService.create(req.body);
        res.status(201).json(student);
    }

    async edit(req: Request, res: Response) {
        const student = await studentService.update(String(req.params.id), req.body);
        res.status(200).json(student);
    }

    async delete(req: Request, res: Response) {
        await studentService.delete(String(req.params.id));
        res.status(200).json({message: "Xóa học sinh thành công"});
    }

    async restore(req: Request, res: Response) {
        const student = await studentService.restore(String(req.params.id));
        res.status(200).json(student);
    }

    async assignCard(req: Request, res: Response) {
        const student = await studentService.assignCard(String(req.params.id), req.body.cardId);
        res.status(200).json(student);
    }

    async removeCard(req: Request, res: Response) {
        const student = await studentService.removeCard(String(req.params.id));
        res.status(200).json(student);
    }
}

export const studentController = new StudentController();
