import { Router } from "express";
import { buildOpenApi } from "./openapi";

export const docsRouter = Router();
let cached: ReturnType<typeof buildOpenApi> | undefined;
docsRouter.get("/api/openapi.json", (_req, res) => {
    cached ??= buildOpenApi();
    res.json(cached);
});
for (const asset of ["swagger-ui-bundle.js", "swagger-ui.css"]) {
    docsRouter.get("/api/docs/" + asset, (_req, res) =>
        res.sendFile(require.resolve("swagger-ui-dist/" + asset)),
    );
}
docsRouter.get("/api/docs/init.js", (_req, res) => {
    res.type("js").send(`
SwaggerUIBundle({
    url: "/api/openapi.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    validatorUrl: null,
    plugins: [() => ({
        statePlugins: {
            spec: {
                wrapSelectors: {
                    allowTryItOutFor: (original, system) => (state, path, method) =>
                        !system.specSelectors.specJson().getIn(["paths", path, method, "x-fixture-only"]) &&
                        original(state, path, method)
                }
            }
        }
    })]
});`);
});
docsRouter.get("/api/docs", (_req, res) => {
    res
        .set(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'",
        )
        .type("html").send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>GuardianWay API</title>
    <link rel="stylesheet" href="/api/docs/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script src="/api/docs/init.js"></script>
</body>
</html>`);
});
