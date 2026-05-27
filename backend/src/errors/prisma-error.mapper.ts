import {Prisma} from "@prisma/client";
import {AppError} from "./app-error";
import {ConflictError, NotFoundError, ValidationError} from "./http-errors";

export function mapPrismaError(error: unknown): Error {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002": {
                const target = (error.meta?.target as string[] | string | undefined);
                const fields = Array.isArray(target) ? target.join(", ") : target;
                return new ConflictError(
                    fields ? `Giá trị đã tồn tại cho trường: ${fields}` : "Dữ liệu đã tồn tại",
                );
            }
            case "P2025":
                return new NotFoundError("Không tìm thấy bản ghi");
            case "P2003":
                return new ConflictError("Vi phạm ràng buộc khóa ngoại");
            case "P2014":
                return new ConflictError("Vi phạm ràng buộc quan hệ");
            case "P2000":
                return new ValidationError("Giá trị nhập vào vượt quá độ dài cho phép");
            case "P2011":
                return new ValidationError("Trường bắt buộc không được để trống");
            default:
                return error as unknown as Error;
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return new ValidationError("Dữ liệu không hợp lệ");
    }

    return error as Error;
}
