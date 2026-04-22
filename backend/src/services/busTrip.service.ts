import {BusTripStatus} from "@prisma/client";
import {busTripRepository, GetAllBusTripsParams, UpsertBusTripInput} from "../repositories/busTrip.repository";

interface BusTripPayload {
    routeId?: string;
    busId?: string;
    driverId?: string;
    date?: string;
    startTime?: string;
    endTime?: string | null;
    status?: BusTripStatus;
}

class BusTripService {
    async getAll(params: GetAllBusTripsParams = {}) {
        return busTripRepository.getAll(params);
    }

    async create(data: BusTripPayload) {
        const parsed = this.parseAndValidatePayload(data);
        return busTripRepository.create(parsed);
    }

    async update(id: string, data: BusTripPayload) {
        if (!id) {
            throw new Error("Thiếu thông tin chuyến đi");
        }
        const parsed = this.parseAndValidatePayload(data);
        return busTripRepository.update(id, parsed);
    }

    async delete(id: string) {
        if (!id) {
            throw new Error("Thiếu thông tin chuyến đi");
        }
        return busTripRepository.delete(id);
    }

    private parseAndValidatePayload(data: BusTripPayload): UpsertBusTripInput {
        const {routeId, busId, driverId, date, startTime, endTime, status} = data;

        if (!routeId || !busId || !driverId || !date || !startTime) {
            throw new Error("Thiếu thông tin chuyến đi");
        }

        const tripDate = new Date(date);
        if (isNaN(tripDate.getTime())) {
            throw new Error("Ngày chạy không hợp lệ");
        }

        const parsedStartTime = this.parseTime(startTime);
        if (!parsedStartTime) {
            throw new Error("Giờ bắt đầu không hợp lệ");
        }

        let parsedEndTime: Date | null = null;
        if (typeof endTime === "string" && endTime.trim().length > 0) {
            parsedEndTime = this.parseTime(endTime);
            if (!parsedEndTime) {
                throw new Error("Giờ kết thúc không hợp lệ");
            }
            if (parsedEndTime.getTime() <= parsedStartTime.getTime()) {
                throw new Error("Giờ kết thúc phải sau giờ bắt đầu");
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
