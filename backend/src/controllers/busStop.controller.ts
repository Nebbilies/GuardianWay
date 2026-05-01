import {Request, Response} from "express";
import {busStopService} from "../services/busStop.service";
import {GetAllBusStopsParams} from "../repositories/busStop.repository";

class BusStopController {
    async getAll(req: Request, res: Response) {
        const {search, isSchoolStop, page, limit, sort} = req.query;

        const params: GetAllBusStopsParams = {};

        if (typeof search === 'string') params.search = search;
        if (isSchoolStop !== undefined) params.isSchoolStop = isSchoolStop === 'true';
        if (typeof page === 'string') params.page = parseInt(page, 10);
        if (typeof limit === 'string') params.limit = parseInt(limit, 10);
        if (typeof sort === 'string') params.sort = sort;

        const busStops = await busStopService.getAll(params);
        res.json(busStops);
    }

    async create(req: Request, res: Response) {
        const busStop = await busStopService.create(req.body);
        res.status(201).json(busStop);

    }

    async edit(req: Request, res: Response) {
        const busStop = await busStopService.edit(String(req.params.id), req.body);
        res.status(200).json(busStop);
    }

    async delete(req: Request, res: Response) {
        const busStop = await busStopService.delete(String(req.params.id));
        res.status(200).json(busStop);
    }
}

export const busStopController = new BusStopController();

