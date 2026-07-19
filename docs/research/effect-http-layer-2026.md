# Effect HTTP layer, state of the art mid-2026: @effect/platform HttpApi vs Fastify shell

Research for [meli-turbo#152](https://github.com/mmurakaru/meli-turbo/issues/152), verified against primary sources July 2026.

## Recommendation

Keep Fastify 5 as the HTTP shell and run Effect behind a `ManagedRuntime` (Fastify handler calls `runtime.runPromise`).
Do not target `@effect/platform` HttpApi for cortex now.
Confidence: medium-high.

Revisit HttpApi when both hold: a shared TypeScript contracts package exists with a consumer that would use a generated typed client, and HttpApi graduates out of `effect/unstable/*` to a 1.0+ semver guarantee.

## Versions observed

- `effect` core stable is 3.22.0 on the `latest` tag; v4 is beta (`effect@beta`).
- `@effect/platform` is 0.96.x, last publish around April 2026 - a 0.x package.
- Per the 2026-07-17 "This Week in Effect", the `main` branch of `Effect-TS/effect` is now officially Effect v4, with v3 on a maintained release queue. v4 remains beta.

Version numbers come from npm registry web pages and the Effect blog (a direct `npm view` was unavailable in the research session).

## 1. HttpApi maturity and stability

- On v3 (today's stable), HttpApi ships inside `@effect/platform` 0.96.x - never reached 1.0. Effect's 0.x platform packages take frequent minor bumps carrying breaking changes. Confirmed 2026 breaking changes include: `withResponse` renamed to `responseMode`; `HttpApiClient`/`urlBuilder` reworked to schemas; HttpApi schema errors becoming defects unless explicitly transformed; middleware error-array changes; an `HttpApi.Any` constraint fix.
- On v4 (beta, now the main branch), HttpApi moved under `effect/unstable/*`. The migration doc states verbatim that unstable modules "may receive breaking changes in minor releases" and lists `httpapi` (plus `http`, `jsonschema`) among them, while modules outside `unstable/` follow strict semver.
- Net: on either line, HttpApi is pre-1.0 or explicitly unstable. Fastify 5 is a stable major with a semver guarantee.

Sources: [effect-smol MIGRATION.md](https://github.com/Effect-TS/effect-smol/blob/main/MIGRATION.md), [Effect v4 beta launch-to-May recap](https://effect.website/blog/effect-v4beta-launch-to-may-recap/), [This Week in Effect 2026-07-17](https://effect.website/blog/this-week-in-effect/2026/07/17/), [HttpApiSecurity API docs](https://effect-ts.github.io/effect/platform/HttpApiSecurity.ts.html).

## 2. Contract-first routing and OpenAPI generation

HttpApi's model - `HttpApiEndpoint` grouped into `HttpApiGroup` merged into an `HttpApi`, with `OpenApi.fromApi` deriving the OpenAPI doc and `HttpApiScalar`/`HttpApiSwagger` serving the reference UI - is architecturally equivalent to cortex's existing stack (`@lokalise/fastify-api-contracts` with Zod, `@fastify/swagger`, Scalar).
HttpApi's edge is that the same contract also mints a typed client (`HttpApiClient`).
Cortex has no shared contracts package and its only consumer is a Next.js app over plain HTTP, so that edge is unused: migrating swaps one working contract+OpenAPI+Scalar stack for another and discards the `@lokalise/fastify-api-contracts` investment.

## 3. Middleware: CORS, security headers, JWT (RS256)

- CORS is covered: `HttpApiBuilder.middlewareCors(...)` returns a Layer; `HttpMiddleware.cors` exists at the server layer.
- JWT bearer: `HttpApiSecurity.bearer` models "a bearer token is present" and feeds OpenAPI security output, but does not verify signatures. RS256 verification is DIY via `HttpApiBuilder.middlewareSecurity` calling a JWT library - feasible, but no more batteries-included than the working Fastify auth.
- Security headers: no first-party helmet equivalent; a custom `HttpMiddleware` would replace the mature `@fastify/helmet`.

Sources: [HttpApiSecurity](https://effect-ts.github.io/effect/platform/HttpApiSecurity.ts.html), [HttpApiBuilder](https://effect-ts.github.io/effect/platform/HttpApiBuilder.ts.html).

## 4. Effect Schema vs Zod at the boundary

HttpApi is tightly coupled to Effect Schema for both validation and OpenAPI/JSON-Schema derivation.
Zod interoperates via Standard Schema (Zod, Valibot, ArkType, and Effect Schema all implement it), but Standard Schema standardizes only the validate contract - it does not give HttpApi OpenAPI generation from a Zod schema.
Contract-first OpenAPI under HttpApi effectively requires authoring contracts in Effect Schema (or maintaining a Zod-to-Effect-Schema conversion).
Keeping Fastify keeps the existing Zod contracts as-is, still emitting OpenAPI via `@fastify/swagger`.

Sources: [standardschema.dev on JSON Schema](https://standardschema.dev/json-schema).

## 5. Ecosystem and community signals

- HttpApi shows very high maintenance velocity - hardening in essentially every weekly update through 2026 (reused response schemas, normalized payload media types, hardened API-docs HTML, duplicate-handler rejection, `HttpApiError` for 422). Good for capability; also evidence of an API still in motion.
- Clearest named production adopter: OpenCode migrated from Hono to Effect HttpApi (release 1.14.42). Effect adoption is growing broadly, but no large-scale named HttpApi references rival Fastify's install base.

Sources: This Week in Effect 2026-07-17 and 2026-07-10, OpenCode changelog.

## 6. The Fastify-shell + ManagedRuntime pattern

- `ManagedRuntime` is the officially documented mechanism: build a runtime once from the service's Layers, call `runtime.runPromise(effect)` inside promise-based handlers. Effect's Runtime docs frame ManagedRuntime for servers and workers running many effects over the same layers; the same pattern is used for Effect-in-tRPC, Next.js, and Cloudflare Workers.
- The old official Fastify binding now lives under `Effect-Deprecated/fastify` (deprecated, ~6 commits): the endorsed integration is a plain `ManagedRuntime.runPromise` call from a normal Fastify handler, not a bespoke adapter.
- Trade-offs: keep Fastify 5, Zod contracts, swagger, Scalar, helmet, and RS256 JWT exactly as-is; gain Effect's typed error and dependency model behind the boundary. Contract types are enforced at the Fastify/Zod edge rather than carried as Effect Schema inside Effect - low cost here given no shared-contract consumer. Enables incremental route-by-route migration versus HttpApi's all-or-nothing boundary rewrite.

Sources: [Effect Runtime docs](https://effect.website/docs/runtime/), [ManagedRuntime API docs](https://effect-ts.github.io/effect/effect/ManagedRuntime.ts.html), [Effect-Deprecated/fastify](https://github.com/Effect-Deprecated/fastify).

## 7. Deciding evidence, in order

1. HttpApi is not semver-stable in mid-2026 - pre-1.0 0.x on v3, explicitly `effect/unstable/*` on v4's new main branch. Wrong risk profile for a production HTTP contract.
2. Cortex does not consume HttpApi's headline benefit (shared typed `HttpApiClient`); with no shared contracts package the migration cost buys nothing consumable.
3. Fastify already delivers contract-first + OpenAPI + Scalar on a stable major with a far larger track record.
4. ManagedRuntime is the officially documented integration and allows incremental adoption without betting the HTTP layer on a moving target.
