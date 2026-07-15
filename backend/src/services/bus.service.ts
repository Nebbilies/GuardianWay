import {busRepository, CreateBusInput, GetAllBusesParams, UpdateBusInput} from "../repositories/bus.repository";
import {Bus} from "@prisma/client";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }

    async create(schoolId: string, data: Omit<CreateBusInput, "schoolId">): Promise<Bus> {
        return busRepository.create({...data, schoolId});
    }

    async update(id: string, schoolId: string, data: UpdateBusInput): Promise<Bus> {
        return busRepository.update(id, schoolId, data);
    }

    async delete(id: string, schoolId: string) {
        return busRepository.delete(id, schoolId);
    }
}

export const busService = new BusService();