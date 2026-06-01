import pino from "pino";

type LogPayload = Record<string, unknown>;

// Raw pino instance — used directly by pino-http.
export const baseLogger = pino({
    level: process.env.LOG_LEVEL || "info",
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: undefined, // drop pid/hostname noise; keep logs lean for Loki
});

// Wrapper preserving the existing (message, payload) call sites.
export const logger = {
    info(message: string, payload: LogPayload = {}) {
        baseLogger.info(payload, message);
    },
    error(message: string, payload: LogPayload = {}) {
        baseLogger.error(payload, message);
    },
};
