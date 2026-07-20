# ADR 0007 - Testing strategy

Status: Accepted
Ticket: [meli-turbo#161](https://github.com/mmurakaru/meli-turbo/issues/161)

## Context

Cortex tests with vitest and a real-infrastructure e2e harness (`test/TestContext.ts`,
`DbCleaner`, `RedisCleaner`, `mockttp`, `fauxqs`). The Effect migration changes how
dependencies are wired (Layers, `ManagedRuntime`), so the test approach must adapt
while keeping the confidence the current e2e suite provides.

## Decision

**Two tiers.**

Unit tests use **`@effect/vitest`** (`it.effect`, `TestClock`/test services). A
service under test is provided a test Layer whose collaborators are doubles
(`Layer.succeed` with an in-memory implementation), so logic is tested without
infrastructure.

Integration and e2e tests keep the **real Postgres/Redis** approach: a test
`ManagedRuntime` is built from `AppLive` with config overrides, and the cleaners are
rebuilt as test Layers around it. These specs skip cleanly when no database is
configured (guarded on `DATABASE_URL`) so the unit suite runs without docker.

The template ships one example of each tier.

## Consequences

- Fast unit feedback without docker; real-infrastructure coverage of drizzle SQL and
  BullMQ behavior preserved where it matters.
- `@effect/vitest` is a new dev dependency; the test-double pattern (Tag + `Layer.succeed`)
  becomes the convention for module unit tests.
- Integration specs are opt-in by environment, keeping CI's unit lane docker-free.
