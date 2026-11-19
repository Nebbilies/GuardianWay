"use strict";

function targetUrl(value = process.env.SCHEMA_DATABASE_URL) {
    if (!value) throw new Error("SCHEMA_DATABASE_URL is required.");
    const url = new URL(value);
    const allowed = ["guardianway_schema_test", "guardianway_schema_demo", "guardianway_dev"];
    if (url.search !== "" ||
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
        !allowed.includes(url.pathname.slice(1))) {
        throw new Error("Schema writes require an explicitly named local schema-next database.");
    }
    return value;
}

function shadowUrl(value, primary) {
    if (!value) throw new Error("SCHEMA_SHADOW_DATABASE_URL is required.");
    const shadow = new URL(value);
    const target = new URL(targetUrl(primary));
    if (shadow.search !== "" ||
        !["postgres:", "postgresql:"].includes(shadow.protocol) ||
        !["localhost", "127.0.0.1", "[::1]"].includes(shadow.hostname)) {
        throw new Error("Shadow writes require a local PostgreSQL URL without query parameters.");
    }
    // All accepted hosts are loopback aliases. Credentials and protocol spelling
    // do not make the same port/database a separate shadow target.
    if (Number(shadow.port || 5432) === Number(target.port || 5432) &&
        shadow.pathname === target.pathname) {
        throw new Error("Shadow database must be different from the primary database.");
    }
    if (shadow.pathname !== "/guardianway_schema_shadow") {
        throw new Error("Shadow database must be the dedicated disposable guardianway_schema_shadow database.");
    }
    return value;
}

module.exports = { targetUrl, shadowUrl };
