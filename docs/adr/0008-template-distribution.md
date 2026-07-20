# ADR 0008 - Template distribution and cortex retrofit

Status: Accepted
Ticket: [meli-turbo#163](https://github.com/mmurakaru/meli-turbo/issues/163)

## Context

The migration produces both a migrated cortex and a reusable Effect service skeleton
(`mmurakaru/meli-service-template`). Two questions: how new services derive from the
template, and whether cortex is held to the template's structure.

## Decision

**GitHub template repository only.** New services are created via "Use this
template". No sync tooling (no generator, no copier-style updates); drift between the
template and services derived from it is accepted and managed by convention.

**Cortex is retrofitted to match the template.** The cortex migration follows the
same architecture the template codifies, so the two stay structurally aligned.

## Consequences

- Low tooling overhead; the template is a starting point, not a live dependency.
- Template improvements do not automatically propagate to derived services - they are
  adopted manually if wanted.
- Because cortex conforms to the template, the template's example module and the
  cortex `sheets` module share one shape, which keeps the reference consistent.

## Revisit when

The number of derived services grows enough that manual drift management hurts; at
that point a monorepo generator (turbo/plop) scaffolding from the template source can
be reconsidered.
