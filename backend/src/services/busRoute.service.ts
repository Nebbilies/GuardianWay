import {busRouteRepository, GetAllBusRoutesParams, RouteStopInput} from "../repositories/busRoute.repository";

class BusRouteService {
    async getAll(params: GetAllBusRoutesParams = {}) {
        return busRouteRepository.getAll(params);
    }

    async create(schoolId: string, data: {
        name: string;
        description?: string;
        stops: RouteStopInput[];
    }) {
        const {name, description, stops} = data;
        return busRouteRepository.create({
            schoolId,
            name,
            stops,
            description: description || null,
        });
    }

    async edit(id: string, schoolId: string, data: {
        name: string;
        description?: string;
        stops: RouteStopInput[];
    }) {
        const {name, description, stops} = data;
        return busRouteRepository.edit({
            id,
            schoolId,
            name,
            stops,
            description: description || null,
        })
    }

    async delete(id: string, schoolId: string) {
        return busRouteRepository.delete(id, schoolId);
    }
}

export const busRouteService = new BusRouteService();