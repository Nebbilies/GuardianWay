import {Request, Response} from "express";
import {GetAllBusesParams} from "../repositories/bus.repository";
import {BusStatus} from "@prisma/client";
import {busService} from "../services/bus.service";

class BusController {
    async getAll(req: Request, res: Response) {
        const {search, page, limit, sort, status} = req.query;
        const params: GetAllBusesParams = {};

        if (typeof search === 'string') params.search = search;
        if (typeof page === 'string') params.page = parseInt(page, 1);
        if (typeof limit === 'string') params.limit = parseInt(limit, 10);
        if (typeof sort === 'string') params.sort = sort;
        if (typeof status === 'string') params.status = status as BusStatus;

        const buses = await busService.getAll(params);
        res.status(200).json(buses);
    }

    async create(req: Request, res: Response) {
        const bus = await busService.create(req.body);
        res.status(201).json(bus);

    }

    async edit(req: Request, res: Response) {
        const bus = await busService.update(String(req.params.id), req.body);
        res.status(200).json(bus);
    }

    async delete(req: Request, res: Response) {
        const bus = await busService.delete(String(req.params.id));
        res.status(200).json(bus);
    }
}

export const busController = new BusController();