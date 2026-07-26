import {busRouteRepository, GetAllBusRoutesParams, RouteStopInput} from "../repositories/busRoute.repository";

class BusRouteService {
    async getAll(params: GetAllBusRoutesParams = {}) {
        return busRouteRepository.getAll(params);
    }

    async create(data: {
        name: string;
        description?: string;
        stops: RouteStopInput[];
    }) {
        const {name, description, stops} = data;
        return busRouteRepository.create({
            name,
            stops,
            description: description || null,
        });
    }

    async edit(id: string, data: {
        name: string;
        description?: string;
        stops: RouteStopInput[];
    }) {
        const {name, description, stops} = data;
        return busRouteRepository.edit({
            id,
            name,
            stops,
            description: description || null,
        })
    }

    async delete(id: string) {
        return busRouteRepository.delete(id);
    }
}

export const busRouteService = new BusRouteService();