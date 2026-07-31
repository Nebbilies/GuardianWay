import { busStopRepository, GetAllBusStopsParams } from "../repositories/busStop.repository";
import { auditService } from "./audit.service";

class BusStopService {
  async getAll(params: GetAllBusStopsParams = {}) {
    return busStopRepository.getAll(params);
  }

  async create(data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;
    const stop = await busStopRepository.create({
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    });
    await auditService.record({ action: "busStop.created", targetType: "BusStop", targetId: stop.id });
    return stop;
  }

  async edit(id: string, data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;
    const stop = await busStopRepository.edit(id, {
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    });
    await auditService.record({ action: "busStop.updated", targetType: "BusStop", targetId: id, metadata: { fields: Object.keys(data) } });
    return stop;
  }

  async delete(id: string) {
    const result = await busStopRepository.delete(id);
    await auditService.record({ action: "busStop.deleted", targetType: "BusStop", targetId: id });
    return result;
    }
}

export const busStopService = new BusStopService();
