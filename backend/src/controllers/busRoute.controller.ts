import {Request, Response} from "express";
import {GetAllBusRoutesParams} from "../repositories/busRoute.repository";
import {busRouteService} from "../services/busRoute.service";

class BusRouteController {
    async getAll(req: Request, res: Response) {
        const {search, page, limit, sort} = req.query;
        const params: GetAllBusRoutesParams = {};

        if (typeof search === 'string') params.search = search;
        if (typeof page === 'string') params.page = parseInt(page, 1);
        if (typeof limit === 'string') params.limit = parseInt(limit, 10);
        if (typeof sort === 'string') params.sort = sort;

        const busRoutes = await busRouteService.getAll(params);
        res.json(busRoutes);

    }

    async create(req: Request, res: Response) {
        const busRoute = await busRouteService.create(req.body);
        res.status(201).json(busRoute);
    }

    async edit(req: Request, res: Response) {
        const busRoute = await busRouteService.edit(String(req.params.id), req.body);
        res.status(200).json(busRoute);
    }

    async delete(req: Request, res: Response) {
        const busRoute = await busRouteService.delete(String(req.params.id));
        res.status(200).json(busRoute);
    }
}

export const busRouteController = new BusRouteController();