import {busRepository, GetAllBusesParams} from "../repositories/bus.repository";
import {Bus} from "@prisma/client";
import {ValidationError} from "../errors/http-errors";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }

    async create(data: Pick<Bus, "licensePlate" | "model" | "capacity" | "status">): Promise<Bus> {
        const {licensePlate, model, capacity, status} = data;
        if (!licensePlate || !model || typeof capacity !== "number" || !status) {
            throw new ValidationError("Thiếu thông tin của xe buýt");
        }
        return busRepository.create(data);
    }

    async update(id: string, data: Partial<Pick<Bus, "licensePlate" | "model" | "capacity" | "status">>): Promise<Bus> {
        if (!id) {
            throw new ValidationError("Thiếu thông tin của xe buýt");
        }
        if (data.licensePlate === "" || data.model === "" || (data.capacity !== undefined && typeof data.capacity !== "number") || (data.status !== undefined && !data.status)) {
            throw new ValidationError("Thông tin cập nhật của xe buýt không hợp lệ");
        }
        return busRepository.update(id, data);
    }

    async delete(id: string) {
        if (!id) {
            throw new ValidationError("Thiếu thông tin của xe buýt");
        }
        return busRepository.delete(id);
    }
}

export const busService = new BusService();