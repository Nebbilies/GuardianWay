import { busStopRepository, GetAllBusStopsParams } from "../repositories/busStop.repository";

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
    return busStopRepository.create({
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    });
  }

  async edit(id: string, data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    isSchoolStop?: boolean;
  }) {
    const { name, address, latitude, longitude, isSchoolStop } = data;
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
        return busStopRepository.delete(id);
    }
}

export const busStopService = new BusStopService();
