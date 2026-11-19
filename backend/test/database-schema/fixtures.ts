import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Client } from "pg";

export const seedRecords = JSON.parse(readFileSync(path.resolve("test/database-schema/fixtures/sql-seed-data.json"), "utf8"));
export const data = (model: string) => seedRecords.find((row: any) => row.model === model).data;
export const schoolB = seedRecords.filter((row: any) => row.model === "school")[1].data.id;
export { randomUUID };

function identifier(value: string) {
    if (!/^[a-z][a-z0-9_]*$/.test(value)) throw new Error("Unexpected fixture identifier");
    return `"${value}"`;
}

/** Clone a valid fixture, omitting DB-generated columns, then vary one contract. */
export async function clone(db: Client, table: string, templateId: string, changes: Record<string, unknown> = {}) {
    const source = await db.query(`SELECT * FROM ${identifier(table)} WHERE id = $1 LIMIT 1`, [templateId]);
    if (!source.rows[0]) throw new Error(`Missing fixture in ${table}`);
    const generated = await db.query(`SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND is_generated <> 'NEVER'`, [table]);
    const row = { ...source.rows[0], id: randomUUID(), ...changes };
    for (const column of generated.rows) delete row[column.column_name];
    const fields = Object.keys(row);
    const result = await db.query(`INSERT INTO ${identifier(table)} (${fields.map(identifier).join(",")})
        VALUES (${fields.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`, fields.map(field => row[field]));
    return result.rows[0];
}
