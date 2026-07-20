# ADR 0006 - Configuration via Effect.Config

Status: Accepted
Ticket: [meli-turbo#162](https://github.com/mmurakaru/meli-turbo/issues/162)

## Context

Cortex configures itself through `envase` (a Lokalise-adjacent package) plus Zod, and
generates `docs/environment-variables.md` via `envase generate`/`validate` wired into
lint. Decoupling removes `envase` while keeping validated config and the docs
discipline.

## Decision

Use **`Effect.Config`** as the configuration mechanism. A central
`src/runtime/config.ts` declares nested `Config.all` groups (app, database, redis,
queue, posthog, observability) with `Config.redacted` for secrets. The config is
exposed as a Layer the composition root provides.

**Env docs stay generated.** Each variable is declared with documentation metadata
(name, group, description, secret flag, default) alongside its `Config`, and a small
script renders `docs/environment-variables.md` from that single definition. A lint
step validates the committed doc is current. `envase` is removed.

## Consequences

- Config is validated at startup with typed errors (`ConfigError`), and secrets are
  `Redacted` so they don't leak into logs.
- The env-var reference cannot silently drift from code: the generator and validator
  read the same registry the `Config` is built from.
- One fewer Lokalise-adjacent dependency.
