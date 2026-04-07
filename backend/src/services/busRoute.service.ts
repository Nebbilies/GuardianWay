import {busRouteRepository, GetAllBusRoutesParams} from "../repositories/busRoute.repository";

class BusRouteService {
    async getAll(params: GetAllBusRoutesParams = {}) {
        return busRouteRepository.getAll(params);
    }

    async create(data: {
        name?: string;
        description?: string;
    }) {
        const {name, description} = data;

        if (!name) {
            throw new Error("Thiếu thông tin của tuyến đường");
        }

        return busRouteRepository.create({
            name,
            description: description || null,
        });
    }

    async edit(id: string, data: {
        name?: string;
        description?: string;
    }) {
        const {name, description} = data;

        if (!id || !name) {
            throw new Error("Thiếu thông tin của tuyến đường");
        }

        return busRouteRepository.edit({
            id,
            name,
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