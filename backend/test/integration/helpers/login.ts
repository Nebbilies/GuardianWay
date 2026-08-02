import request from "supertest";
import type { Express } from "express";
import { TEST_PASSWORD } from "../fixtures";

// Imported dynamically so the app (and its transitive prisma/redis config modules,
// which read env at load time) is only evaluated after setup-env.ts has run.
export async function loadApp(): Promise<Express> {
    const mod = await import("../../../src/app");
    return mod.default;
}

export async function loginAs(
    app: Express,
    email: string,
    password: string = TEST_PASSWORD,
): Promise<string[]> {
    const res = await request(app).post("/api/auth/login").send({ email, password });
    if (res.status !== 200) {
        throw new Error(`login failed for ${email}: ${res.status} ${res.text}`);
    }
    const raw = res.headers["set-cookie"];
    return Array.isArray(raw) ? raw : [raw];
}
