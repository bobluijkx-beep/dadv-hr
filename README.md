# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 (architectuur, database, Auth), Fase 2 (personeelsdossiers) en Fase 3 (contractbeheer) zijn klaar** — alle drie geverifieerd tegen een live Supabase-project, en Fase 1+2 draaien ook al in productie op Vercel. Fase 3 levert: een Contract-tab op het dossier met meerdere contracten per medewerker (historie), salarisbeheer met automatische salarishistorie (oud/nieuw/verschil/percentage/reden) en een nieuw-contractformulier — salaris blijft, zoals in het ontwerp vastgelegd, volledig ontoegankelijk voor leidinggevenden en medewerkers. Zie de roadmap in het functioneel ontwerp voor de volgende fases (documentbeheer, roosters, overuren, verlof, verzuim, dashboards, Resend, AFAS-voorbereiding).

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
