import {busRepository, GetAllBusesParams} from "../repositories/bus.repository";
import {Bus} from "@prisma/client";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }

    async create(data: Pick<Bus, "licensePlate" | "model" | "capacity" | "status">): Promise<Bus> {
        return busRepository.create(data);
    }

    async update(id: string, data: Partial<Pick<Bus, "licensePlate" | "model" | "capacity" | "status">>): Promise<Bus> {
        return busRepository.update(id, data);
    }

    async delete(id: string) {
        return busRepository.delete(id);
    }
}

export const busService = new BusService();