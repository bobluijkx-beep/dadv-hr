# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 (architectuur, database, Auth) en Fase 2 (personeelsdossiers) zijn klaar** — beide geverifieerd tegen een live Supabase-project. Fase 2 levert: medewerkersoverzicht (zoeken/filteren, rolgescoped via RLS), dossierdetail met Persoonlijk/Privé/Werk-tabs, adres- en contacthistorie, BSN invoeren/wijzigen (versleuteld), en het aanmaken van nieuwe medewerkers. Zie de roadmap in het functioneel ontwerp voor de volgende fases (contractbeheer, documentbeheer, roosters, overuren, verlof, verzuim, dashboards, Resend, AFAS-voorbereiding).

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
