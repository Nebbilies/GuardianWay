import { Prisma } from "@prisma/client";
import { AppError } from "./app-error";
import { ConflictError, NotFoundError, ValidationError } from "./http-errors";

export function mapPrismaError(error: unknown): Error {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002": {
                const metadata = error.meta as
                    Record<string, unknown> | undefined;
                const adapter = metadata?.driverAdapterError as
                    | { cause?: { constraint?: { fields?: unknown } } }
                    | undefined;
                const target =
                    metadata?.target ?? adapter?.cause?.constraint?.fields;
                const fields = Array.isArray(target)
                    ? target
                          .filter((field) => typeof field === "string")
                          .join(", ")
                    : typeof target === "string"
                      ? target
                      : undefined;
                if (fields?.includes("email")) {
                    return new ConflictError(
                        "Account email is already in use",
                        "ACCOUNT_EMAIL_EXISTS",
                    );
                }
                if (fields?.includes("plate_number")) {
                    return new ConflictError(
                        "Vehicle plate number is already in use",
                        "VEHICLE_PLATE_EXISTS",
                    );
                }
                if (fields?.includes("card_uid")) {
                    return new ConflictError(
                        "Card already has an open assignment",
                        "CARD_ALREADY_ASSIGNED",
                    );
                }
                if (
                    fields?.includes("schedule_key") &&
                    fields.includes("service_date")
                ) {
                    return new ConflictError(
                        "Trip already exists for this schedule, date and direction",
                        "TRIP_ALREADY_EXISTS",
                    );
                }
                if (fields?.includes("code")) {
                    return new ConflictError(
                        "Resource code is already in use",
                        "RESOURCE_CODE_EXISTS",
                    );
                }
                return new ConflictError(
                    fields
                        ? `A value already exists for field: ${fields}`
                        : "Data already exists",
                );
            }
            case "P2025":
                return new NotFoundError("Record not found");
            case "P2003":
                return new ConflictError(
                    "Referenced data is invalid or still in use",
                );
            case "P2014":
                return new ConflictError("Relationship constraint violation");
            case "P2000":
                return new ValidationError(
                    "Input value exceeds the allowed length",
                );
            case "P2011":
                return new ValidationError("A required field cannot be null");
            default:
                return error as unknown as Error;
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return new ValidationError("Invalid input data");
    }

    return error as Error;
}
