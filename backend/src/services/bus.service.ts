import {busRepository, CreateBusInput, GetAllBusesParams, UpdateBusInput} from "../repositories/bus.repository";
import {Bus} from "@prisma/client";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }

    async create(data: CreateBusInput): Promise<Bus> {
        return busRepository.create(data);
    }

    async update(id: string, data: UpdateBusInput): Promise<Bus> {
        return busRepository.update(id, data);
    }

    async delete(id: string) {
        return busRepository.delete(id);
    }
}

export const busService = new BusService();