"use strict";
const { createHash } = require("node:crypto");
// UUIDv5 uses the school's UUID as namespace, so the same dataset can be
// provisioned independently for each configured demo school.
function recordId(schoolId, key) {
    const bytes = createHash("sha1")
        .update(Buffer.from(schoolId.replaceAll("-", ""), "hex"))
        .update(key)
        .digest()
        .subarray(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x50;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString("hex");
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join("-");
}

module.exports = { recordId };
