import { busStopRepository, GetAllBusStopsParams } from "../repositories/busStop.repository";

class BusStopService {
  async getAll(params: GetAllBusStopsParams = {}) {
    return busStopRepository.getAll(params);
  }

  async create(schoolId: string, data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;
    return busStopRepository.create({
      schoolId,
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    });
  }

  async edit(id: string, schoolId: string, data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;
    return busStopRepository.edit(id, schoolId, {
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    })
  }

  async delete(id: string, schoolId: string) {
    return busStopRepository.delete(id, schoolId);
    }
}

export const busStopService = new BusStopService();
