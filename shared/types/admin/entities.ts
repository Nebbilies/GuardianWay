import {BusStatus, BusTripStatus, Role, TripType} from './enums'

export interface User {
    id: string
    name: string
    email: string
    role: Role
    schoolId: string | null
    phoneNumber: string | null
    address: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface StudentProfile {
    id: string
    schoolId: string
    fullName: string
    dateOfBirth: string
    studentId: string
    studentClass: string
    cardTokenHash: string | null
    parentId: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface DriverProfile {
    id: string
    userId: string
    licenseNumber: string
}

export interface Bus {
    id: string
    schoolId: string
    licensePlate: string
    model: string
    capacity: number
    status: BusStatus
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface BusStop {
    id: string
    schoolId: string
    name: string
    address: string
    latitude: number
    longitude: number
    isSchoolStop: boolean
    geofenceRadius: number | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface BusRoute {
    id: string
    schoolId: string
    name: string
    description: string | null
    totalDistance: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface RouteStop {
    id: string
    routeId: string
    stopId: string
    stopOrder: number
    scheduledTime: string | null
    isFinalStop: boolean
    stop: BusStop
}

export interface BusTrip {
    id: string
    schoolId: string
    routeId: string
    busId: string
    driverId: string
    tripType: TripType
    scheduledStartTime: string
    scheduledEndTime: string
    actualStartTime: string | null
    actualEndTime: string | null
    status: BusTripStatus
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}

export interface School {
    id: string
    name: string
    address: string
    slug: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    deletedAt: string | null
}
