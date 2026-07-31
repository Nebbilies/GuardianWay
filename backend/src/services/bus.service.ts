import {busRepository, CreateBusInput, GetAllBusesParams, UpdateBusInput} from "../repositories/bus.repository";
import {Bus} from "@prisma/client";
import {auditService} from "./audit.service";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }

    async create(data: CreateBusInput): Promise<Bus> {
        const bus = await busRepository.create(data);
        await auditService.record({ action: "bus.created", targetType: "Bus", targetId: bus.id });
        return bus;
    }

    async update(id: string, data: UpdateBusInput): Promise<Bus> {
        const bus = await busRepository.update(id, data);
        await auditService.record({ action: "bus.updated", targetType: "Bus", targetId: id, metadata: { fields: Object.keys(data) } });
        return bus;
    }

    async delete(id: string) {
        const result = await busRepository.delete(id);
        await auditService.record({ action: "bus.deleted", targetType: "Bus", targetId: id });
        return result;
    }
}

export const busService = new BusService();