import {BusTripStatus, TripType} from "@prisma/client";
import {busTripRepository, GetAllBusTripsParams, UpsertBusTripInput} from "../repositories/busTrip.repository";
import {ValidationError} from "../errors/http-errors";

interface BusTripPayload {
    routeId: string;
    busId: string;
    driverId: string;
    tripType: TripType;
    // full ISO-8601 datetimes (timestamptz), e.g. 2026-07-15T07:30:00Z
    scheduledStartTime: string;
    scheduledEndTime: string;
    status?: BusTripStatus;
}

class BusTripService {
    async getAll(params: GetAllBusTripsParams = {}) {
        return busTripRepository.getAll(params);
    }

    async create(schoolId: string, data: BusTripPayload) {
        return busTripRepository.create(this.parsePayload(schoolId, data));
    }

    async update(id: string, schoolId: string, data: BusTripPayload) {
        return busTripRepository.update(id, this.parsePayload(schoolId, data));
    }

    async delete(id: string, schoolId: string) {
        return busTripRepository.delete(id, schoolId);
    }

    private parsePayload(schoolId: string, data: BusTripPayload): UpsertBusTripInput {
        const {routeId, busId, driverId, tripType, scheduledStartTime, scheduledEndTime, status} = data;

        const start = new Date(scheduledStartTime);
        if (isNaN(start.getTime())) {
            throw new ValidationError("Giờ bắt đầu không hợp lệ");
        }

        const end = new Date(scheduledEndTime);
        if (isNaN(end.getTime())) {
            throw new ValidationError("Giờ kết thúc không hợp lệ");
        }

        if (end.getTime() <= start.getTime()) {
            throw new ValidationError("Giờ kết thúc phải sau giờ bắt đầu");
        }

        return {
            schoolId,
            routeId,
            busId,
            driverId,
            tripType,
            scheduledStartTime: start,
            scheduledEndTime: end,
            status: status || BusTripStatus.SCHEDULED,
        };
    }
}

export const busTripService = new BusTripService();
