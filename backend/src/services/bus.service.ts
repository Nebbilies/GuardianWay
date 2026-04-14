import {busRepository, GetAllBusesParams} from "../repositories/bus.repository";
import {Bus} from "@prisma/client";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }

    async create(data: Pick<Bus, "licensePlate" | "model" | "capacity" | "status">): Promise<Bus> {
        const { licensePlate, model, capacity, status } = data;
        if (!licensePlate || !model || typeof capacity !== "number" || !status) {
            throw new Error("Thiếu thông tin của xe buýt");
        }
        return busRepository.create(data);
    }

    async update(id: string, data: Partial<Pick<Bus, "licensePlate" | "model" | "capacity" | "status">>): Promise<Bus> {
        if (!id) {
            throw new Error("Thiếu thông tin của xe buýt");
        }
        if (data.licensePlate === "" || data.model === "" || (data.capacity !== undefined && typeof data.capacity !== "number") || (data.status !== undefined && !data.status)) {
            throw new Error("Thông tin của xe buýt không hợp lệ");
        }
        return busRepository.update(id, data);
    }

    async delete(id: string) {
        if (!id) {
            throw new Error("Thiếu thông tin của xe buýt");
        }
        return busRepository.delete(id);
    }
}

export const busService = new BusService();