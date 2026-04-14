import {busRepository, GetAllBusesParams} from "../repositories/bus.repository";

class BusService {
    async getAll(params: GetAllBusesParams = {}) {
        return busRepository.getAll(params);
    }
}

export const busService = new BusService();