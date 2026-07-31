import {busRouteRepository, GetAllBusRoutesParams, RouteStopInput} from "../repositories/busRoute.repository";
import {auditService} from "./audit.service";

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
        const route = await busRouteRepository.create({
            name,
            stops,
            description: description || null,
        });
        await auditService.record({ action: "busRoute.created", targetType: "BusRoute", targetId: route.id });
        return route;
    }

    async edit(id: string, data: {
        name: string;
        description?: string;
        stops: RouteStopInput[];
    }) {
        const {name, description, stops} = data;
        const route = await busRouteRepository.edit({
            id,
            name,
            stops,
            description: description || null,
        });
        await auditService.record({ action: "busRoute.updated", targetType: "BusRoute", targetId: id, metadata: { fields: Object.keys(data) } });
        return route;
    }

    async delete(id: string) {
        const result = await busRouteRepository.delete(id);
        await auditService.record({ action: "busRoute.deleted", targetType: "BusRoute", targetId: id });
        return result;
    }
}

export const busRouteService = new BusRouteService();