import { busStopRepository } from "../repositories/busStop.repository";

class BusStopService {
  async getAll() {
    return busStopRepository.getAll();
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
      throw new Error("Missing required bus stop fields");
    }

    return busStopRepository.create({
      name,
      address,
      latitude,
      longitude,
      isSchoolStop: !!isSchoolStop,
    });
  }
}

export const busStopService = new BusStopService();
