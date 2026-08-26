# @shared/db

Shared Prisma client + database tooling for the micro-frontend services.

- **`prisma.ts`** — a single, process-wide `PrismaClient` singleton
  (cached on `globalThis` in dev so hot reload doesn't leak connection pools).
- **`project.json`** — `db:up` / `db:down` / `db:validate` / `db:generate` /
  `db:migrate` / `db:deploy` / `db:seed` / `db:studio` targets.

## Usage

```ts
import { prisma } from '@shared/db';

const products = await prisma.product.findMany({
  include: { categories: true, attributes: true },
});
```

## Database (local)

```bash
docker compose up -d      # start PostgreSQL 16 + pgAdmin
pnpm db:migrate           # prisma migrate dev (creates/applies migrations)
pnpm db:seed              # idempotent dev seed (products, user, cart, order)
pnpm db:studio            # Prisma Studio at http://localhost:5555
docker compose down       # stop (data persists in the mf_pgdata volume)
```

Connection string lives in `.env` (`DATABASE_URL`); see `.env.example`.
