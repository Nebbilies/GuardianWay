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

    async edit(data: Pick<BusStop, "id" | "name" | "address" | "latitude" | "longitude" | "isSchoolStop">): Promise<BusStop> {
        const { id, ... updateData } = data;
        return prisma.busStop.update({
            where: { id },
            data: updateData,
        })
    }

    async delete(id: string): Promise<BusStop> {
        return prisma.busStop.delete({
            where: { id },
        })
    }
}

export const busStopRepository = new BusStopRepository();