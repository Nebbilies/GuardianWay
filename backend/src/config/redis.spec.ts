import { afterEach, expect, it, vi } from "vitest";

vi.mock("redis", () => ({ createClient: vi.fn(() => ({ on: vi.fn(), connect: vi.fn().mockResolvedValue(undefined), isReady: false })) }));
import { createClient } from "redis";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.clearAllMocks(); });

it("does not connect to Redis when disabled in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("REDIS_ENABLED", "false");
    const config = await import("./redis.js");
    expect(config.redisEnabled).toBe(false);
    expect(vi.mocked(createClient).mock.results[0].value.connect).not.toHaveBeenCalled();
});

it("rejects disabling Redis in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("REDIS_ENABLED", "false");
    await expect(import("./redis.js")).rejects.toThrow("REDIS_ENABLED=false is only supported in development or test");
    expect(createClient).not.toHaveBeenCalled();
});
