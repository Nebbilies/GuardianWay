import {BusTripStatus} from "@prisma/client";
import {busTripRepository, GetAllBusTripsParams, UpsertBusTripInput} from "../repositories/busTrip.repository";
import {ValidationError} from "../errors/http-errors";

interface BusTripPayload {
    routeId: string;
    busId: string;
    driverId: string;
    date: string;
    startTime: string;
    endTime?: string | null;
    status?: BusTripStatus;
}

class BusTripService {
    async getAll(params: GetAllBusTripsParams = {}) {
        return busTripRepository.getAll(params);
    }

    async create(data: BusTripPayload) {
        return busTripRepository.create(this.parsePayload(data));
    }

    async update(id: string, data: BusTripPayload) {
        return busTripRepository.update(id, this.parsePayload(data));
    }

    async delete(id: string) {
        return busTripRepository.delete(id);
    }

    private parsePayload(data: BusTripPayload): UpsertBusTripInput {
        const {routeId, busId, driverId, date, startTime, endTime, status} = data;

        const tripDate = new Date(date);
        if (isNaN(tripDate.getTime())) {
            throw new ValidationError("Ngày chạy không hợp lệ");
        }

        const parsedStartTime = this.parseTime(startTime);
        if (!parsedStartTime) {
            throw new ValidationError("Giờ bắt đầu không hợp lệ");
        }

        let parsedEndTime: Date | null = null;
        if (typeof endTime === "string" && endTime.trim().length > 0) {
            parsedEndTime = this.parseTime(endTime);
            if (!parsedEndTime) {
                throw new ValidationError("Giờ kết thúc không hợp lệ");
            }
            if (parsedEndTime.getTime() <= parsedStartTime.getTime()) {
                throw new ValidationError("Giờ kết thúc phải sau giờ bắt đầu");
            }
        }

        return {
            routeId,
            busId,
            driverId,
            date: tripDate,
            startTime: parsedStartTime,
            endTime: parsedEndTime,
            status: status || BusTripStatus.SCHEDULED,
        };
    }

    private parseTime(value: string): Date | null {
        const [hoursText, minutesText] = value.split(":");
        const hours = Number(hoursText);
        const minutes = Number(minutesText);

        if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
            return null;
        }
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }

        const result = new Date();
        result.setHours(hours, minutes, 0, 0);
        return result;
    }
}

export const busTripService = new BusTripService();
