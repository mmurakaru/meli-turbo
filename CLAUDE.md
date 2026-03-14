## Project READMEs
- `apps/web/README.md` — Next.js frontend
- `services/cortex/README.md` — Fastify backend
## UI and Styling
- Use Tailwind utilities; CSS modules only for well-justified cases.
- Mobile-first responsive design.

## Next.js / Performance
- Minimize `use client`, `useEffect`, and `setState`.
- Wrap client components in Suspense with fallback.
- Use dynamic imports for non-critical components.

## Claude-specific
- Fetch current docs instead of relying on training data: https://nextjs.org/docs/llms-full.txt
