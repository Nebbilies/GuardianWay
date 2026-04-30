type LogLevel = "info" | "error";

type LogPayload = Record<string, unknown>;

function write(level: LogLevel, message: string, payload: LogPayload = {}) {
    const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...payload,
    };

    const serialized = JSON.stringify(entry);
    if (level === "error") {
        console.error(serialized);
        return;
    }
    console.log(serialized);
}

export const logger = {
    info(message: string, payload?: LogPayload) {
        write("info", message, payload);
    },
    error(message: string, payload?: LogPayload) {
        write("error", message, payload);
    },
};
