export type Student = { id: string; code: string; name: string };
export type Stop = { id: string; code: string; name: string };
export type Direction = "PICKUP" | "DROPOFF";
export type Registration = {
    id: string;
    student: Student;
    status: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: string;
    reviewNote: string | null;
    days: {
        serviceDate: string;
        direction: Direction;
        requestedStop: Stop | null;
        approvedStop: Stop | null;
    }[];
};
export type Registrations = {
    data: Registration[];
    metadata: {
        currentPage: number;
        totalCount: number;
        pageCount: number;
        previousPage: number | null;
        nextPage: number | null;
        isFirstPage: boolean;
        isLastPage: boolean;
    };
};
export type Manifest = {
    trip: {
        id: string;
        serviceDate: string;
        direction: Direction;
        status: "PLANNED" | "OPEN" | "COMPLETED" | "CANCELLED";
        completedAt: string | null;
        cancellationReason: string | null;
    };
    passengers: {
        id: string;
        student: Student;
        stop: Stop;
        attendance: { kind: "BOARD" | "ALIGHT"; occurredAt: string }[];
    }[];
};

// Paths are relative to /api. Each transport owns authentication and HTTP errors.
export function transportClient(get: <T>(path: string) => Promise<T>) {
    return {
        registrations: (page = 1, limit = 10) =>
            get<Registrations>(
                `/service-registrations?page=${page}&limit=${limit}`,
            ),
        passengers: (tripId: string) =>
            get<Manifest>(
                `/bus-trips/${encodeURIComponent(tripId)}/passengers`,
            ),
    };
}
