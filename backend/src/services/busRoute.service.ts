import {busRouteRepository, GetAllBusRoutesParams} from "../repositories/busRoute.repository";
import {RouteStop} from "@prisma/client";

class BusRouteService {
    async getAll(params: GetAllBusRoutesParams = {}) {
        return busRouteRepository.getAll(params);
    }

    async create(data: {
        name?: string;
        description?: string;
        stops?: Partial<RouteStop>[];
    }) {
        const {name, description, stops} = data;

        if (!name || !stops) {
            throw new Error("Thiếu thông tin của tuyến đường");
        }

        if (stops?.length < 2) {
            throw new Error("Tuyến đường phải có ít nhất 2 trạm dừng");
        }

        return busRouteRepository.create({
            name,
            stops,
            description: description || null,
        });
    }

    async edit(id: string, data: {
        name?: string;
        description?: string;
        stops?: Partial<RouteStop>[];
    }) {
        const {name, description, stops} = data;

        if (!id || !name || !stops) {
            throw new Error("Thiếu thông tin của tuyến đường");
        }

        if (stops?.length < 2) {
            throw new Error("Tuyến đường phải có ít nhất 2 trạm dừng");
        }

        return busRouteRepository.edit({
            id,
            name,
            stops,
            description: description || null,
        })
    }

    async delete(id: string) {
        if (!id) {
            throw new Error("Thiếu thông tin của tuyến đường");
        }

        return busRouteRepository.delete(id);
    }
}

export const busRouteService = new BusRouteService();