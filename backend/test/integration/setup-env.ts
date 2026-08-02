import { inject } from "vitest";

// config/prisma.ts reads DATABASE_URL at module load and calls dotenv, which does
// NOT override an already-set variable. So these assignments must land before any
// application module is imported — setupFiles run before the test file is loaded,
// and loadApp() imports the app dynamically for the same reason.
process.env.DATABASE_URL = inject("databaseUrl");
process.env.DIRECT_URL = inject("databaseUrl");
process.env.REDIS_URL = inject("redisUrl");
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.WEB_BASE_URL = "http://localhost:3000";
process.env.TRUST_PROXY_HOPS = "0";
process.env.NODE_ENV = "test";
