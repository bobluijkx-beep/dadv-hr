# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 t/m 5 zijn klaar** (architectuur/Auth, personeelsdossiers, contractbeheer, documentbeheer, roosters) — allemaal geverifieerd tegen een live Supabase-project, en draaien in productie op Vercel. Fase 5 levert: een Rooster-tab op het dossier (historische roosterperiodes, uren per dag) en een Instellingen-pagina (admin) voor de organisatiebrede pauzeregels. Bruto uren per dag komen uit de vaste `computed_hours`-kolom; de pauzeaftrek (bv. >5,5u = -30min, >8u = -45min) wordt in de applicatielaag toegepast zodat regels aanpasbaar zijn zonder migratie. Leidinggevenden mogen roosters van hun team bewerken (RLS `is_manager_of`), medewerkers zien alleen hun eigen rooster. Zie de roadmap in het functioneel ontwerp voor de volgende fases (overuren, verlof, verzuim, dashboards, Resend, AFAS-voorbereiding).

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
