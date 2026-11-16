"use strict";

function targetUrl(value = process.env.SCHEMA_DATABASE_URL) {
    if (!value) throw new Error("SCHEMA_DATABASE_URL is required.");
    const url = new URL(value);
    const allowed = ["guardianway_schema_test", "guardianway_schema_demo", "guardianway_dev"];
    if (!["postgres:", "postgresql:"].includes(url.protocol) ||
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
        !allowed.includes(url.pathname.slice(1))) {
        throw new Error("Schema writes require an explicitly named local schema-next database.");
    }
    return value;
}

module.exports = { targetUrl };
