import {Bus, BusRoute, BusTrip, DriverProfile, RouteStop, StudentProfile, User} from './entities'

export type UserWithProfiles = User & {
    studentProfile: StudentProfile | null
    driverProfile: DriverProfile | null
}

export type BusRouteWithStops = BusRoute & {
    routeStops: RouteStop[]
}

export type BusTripWithDetails = BusTrip & {
    route: Pick<BusRoute, 'id' | 'name'>
    bus: Pick<Bus, 'id' | 'licensePlate' | 'model' | 'capacity' | 'status'>
    driver: {
        id: string
        user: Pick<User, 'id' | 'name' | 'email'>
    }
}
