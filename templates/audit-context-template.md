# Audit Context
> Produced by `/audit-setup`. All subsequent skills read this file.
> Fill in every field. Mark fields that don't apply as `N/A`.

---

## Run Metadata

| Field | Value |
|-------|-------|
| **Project** | |
| **Date** | |
| **Auditor** | |
| **Mode** | full \| speed |
| **Status** | in-progress |
| **Output dir** | `./audit-reports/YYYY-MM-DD/` |

---

## Tech Stack

| Field | Value | Notes |
|-------|-------|-------|
| **Language(s)** | | e.g. TypeScript, Python |
| **Frontend** | | React \| Next.js \| Vue \| Angular \| None \| Other |
| **Backend** | | Express \| Fastify \| Django \| Flask \| FastAPI \| None \| Other |
| **Database** | | PostgreSQL \| MySQL \| MongoDB \| SQLite \| Supabase \| Firebase \| None \| Other |
| **ORM / Query builder** | | Prisma \| Drizzle \| Sequelize \| Mongoose \| raw \| None \| Other |
| **Auth method** | | JWT \| Sessions \| NextAuth \| Clerk \| Auth0 \| Supabase Auth \| Custom \| None |
| **Deployment** | | Replit \| Heroku \| Vercel \| Railway \| AWS \| None \| Other |
| **Package manager** | | npm \| yarn \| pnpm \| pip \| N/A |

---

## Key File Paths
> List actual paths relative to project root. Multiple paths per row are fine.

| Area | Path(s) |
|------|---------|
| **Auth files** | |
| **API routes / controllers** | |
| **Database schema / models** | |
| **ORM config / migrations** | |
| **Environment / config files** | |
| **Frontend entry point** | |
| **Middleware** | |
| **Tests** | |

---

## Scope

### In Scope
- 

### Out of Scope
- 

---

## Project Statistics
> Run the commands below and fill in the results.

```bash
# File counts
find $AUDIT_PROJECT_PATH -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l
find $AUDIT_PROJECT_PATH -name "*.py" | wc -l

# Rough endpoint count (JS/TS)
grep -r "app\.\|router\." --include="*.ts" --include="*.js" $AUDIT_PROJECT_PATH | grep -E "\.(get|post|put|patch|delete)\(" | wc -l

# Dependency count
cat $AUDIT_PROJECT_PATH/package.json | grep -c '"'
```

| Metric | Value |
|--------|-------|
| **JS/TS files** | |
| **Python files** | |
| **Estimated endpoints** | |
| **Direct dependencies** | |
| **External integrations** | (list services: Stripe, SendGrid, etc.) |

---

## Notes
> Anything unusual about this project that skills should know — monorepo structure, custom auth flow, known issues, etc.

- 
