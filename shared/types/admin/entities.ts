import {BusStatus, BusTripStatus, Role} from './enums'

export interface User {
    id: string
    name: string
    email: string
    role: Role
    phoneNumber: string | null
    address: string | null
    createdAt: string
    updatedAt: string
}

export interface StudentProfile {
    id: string
    userId: string
    studentId: string
    studentClass: string
    parentId: string | null
}

export interface DriverProfile {
    id: string
    userId: string
    licenseNumber: string
}

export interface Bus {
    id: string
    licensePlate: string
    model: string
    capacity: number
    status: BusStatus
    createdAt: string
    updatedAt: string
}

export interface BusStop {
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    isSchoolStop: boolean
    createdAt: string
    updatedAt: string
}

export interface BusRoute {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
}

export interface RouteStop {
    routeId: string
    stopId: string
    stopOrder: number
    scheduledTime: string | null
    isFinalStop: boolean
    stop: BusStop
}

export interface BusTrip {
    id: string
    routeId: string
    busId: string
    driverId: string
    date: string
    startTime: string
    endTime: string | null
    status: BusTripStatus
    createdAt: string
    updatedAt: string
}
