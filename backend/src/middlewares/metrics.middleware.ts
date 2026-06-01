import {NextFunction, Request, Response} from "express";
import {httpRequestDuration} from "../utils/metrics";

// Observe each request's duration. `route` uses the MATCHED express route
// (e.g. "/api/buses/:id"), never the raw URL, to keep label cardinality bounded.
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const endTimer = httpRequestDuration.startTimer();

    res.on("finish", () => {
        const route = req.route?.path
            ? `${req.baseUrl}${req.route.path}`
            : (req.baseUrl || "unmatched");

        endTimer({
            method: req.method,
            route,
            status_code: String(res.statusCode),
        });
    });

    next();
}
