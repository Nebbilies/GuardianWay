import { Prisma } from "@gw/backend"
import {
    User,
    StudentProfile,
    DriverProfile,
    Bus,
    BusStop,
    BusRoute,
    RouteStop,
    BusTrip,
    BoardingRecord,
    TrackingLog,
    Notification,
    BusTripStatus
} from "@gw/backend"
import { PaginationMetadata, PaginatedResponse } from "@gw/shared"

type BusRouteWithStops = Prisma.BusRouteGetPayload<{
    include: {
        routeStops: {
            include: {
                stop: true;
            }
        }
    }
}>

type UserWithProfiles = Prisma.UserGetPayload<{
    include: {
        studentProfile: true;
        driverProfile: true;
    }
}>

type BusTripWithDetails = Prisma.BusTripGetPayload<{
    include: {
        route: true;
        bus: true;
        driver: {
            include: {
                user: true;
            }
        }
    }
}>

export type { User, StudentProfile, DriverProfile, Bus, BusStop, BusRoute, BusRouteWithStops, RouteStop,
    BusTrip, BoardingRecord, TrackingLog, Notification, PaginatedResponse, PaginationMetadata, UserWithProfiles,
    BusTripWithDetails, BusTripStatus
}