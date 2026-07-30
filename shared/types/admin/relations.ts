import {Bus, BusRoute, BusTrip, DriverProfile, RouteStop, StudentProfile, User} from './entities'

export type UserWithProfiles = User & {
    driverProfile: DriverProfile | null
}

export type StudentWithParent = StudentProfile & {
    parent: Pick<User, 'id' | 'name' | 'email' | 'phoneNumber'> | null
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

export type SchoolAdmin = Pick<User, 'id' | 'name' | 'email'> & {
    isActive: boolean
    passwordSetupRequired: boolean
    createdAt: string
}

export type OnboardAdminResponse = {
    user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'schoolId'>
    inviteLink: string
}
