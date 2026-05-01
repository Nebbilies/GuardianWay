import { busStopRepository, GetAllBusStopsParams } from "../repositories/busStop.repository";
import {ValidationError} from "../errors/http-errors";

class BusStopService {
  async getAll(params: GetAllBusStopsParams = {}) {
    return busStopRepository.getAll(params);
  }

  async create(data: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;

    if (!name || !address || typeof latitude !== "number" || typeof longitude !== "number") {
      throw new ValidationError("Thiếu thông tin của trạm dừng");
    }

    return busStopRepository.create({
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    });
  }

  async edit(id: string, data: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;

    if (!id || !name || !address || typeof latitude !== "number" || typeof longitude !== "number") {
      throw new ValidationError("Thiếu thông tin của trạm dừng");
    }

    return busStopRepository.edit({
      id,
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    })
  }

    async delete(id: string) {
        if (!id) {
          throw new ValidationError("Thiếu thông tin của trạm dừng");
        }
        return busStopRepository.delete(id);
    }
}

export const busStopService = new BusStopService();
