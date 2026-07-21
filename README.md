# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 t/m 4 zijn klaar** (architectuur/Auth, personeelsdossiers, contractbeheer, documentbeheer) — allemaal geverifieerd tegen een live Supabase-project, en draaien in productie op Vercel. Fase 4 levert: een Documenten-tab op het dossier met upload/versiebeheer via Supabase Storage. Bestanden zijn nooit publiek — downloaden gaat altijd via een kortlevende signed URL die pas wordt gegenereerd nadat de RLS-gescoopte metadata-query is geslaagd, dus een leidinggevende kan bijvoorbeeld nooit bij een verzuimdocument, ook niet via de storage-laag. Zie de roadmap in het functioneel ontwerp voor de volgende fases (roosters, overuren, verlof, verzuim, dashboards, Resend, AFAS-voorbereiding).

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
