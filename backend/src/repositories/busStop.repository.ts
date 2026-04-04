import prisma from "../config/prisma";
import {BusStop} from "@prisma/client";

class BusStopRepository {
    async getAll(): Promise<BusStop[]> {
        return prisma.busStop.findMany();
    }

    async create(data: Pick<BusStop, "name" | "address" | "latitude" | "longitude" | "isSchoolStop">): Promise<BusStop> {
        return prisma.busStop.create({
            data,
        });
    }
}

export const busStopRepository = new BusStopRepository();