import { Prisma } from "@gw/backend"
import {User, StudentProfile, DriverProfile, Bus, BusStop, BusRoute, RouteStop, BusTrip, BoardingRecord, TrackingLog, Notification } from "@gw/backend"
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

export type { User, StudentProfile, DriverProfile, Bus, BusStop, BusRoute, BusRouteWithStops, RouteStop,
    BusTrip, BoardingRecord, TrackingLog, Notification, PaginatedResponse, PaginationMetadata, UserWithProfiles }