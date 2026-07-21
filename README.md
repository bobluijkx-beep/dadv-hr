# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 t/m 6 zijn klaar** (architectuur/Auth, personeelsdossiers, contractbeheer, documentbeheer, roosters, overuren) — allemaal geverifieerd tegen een live Supabase-project, en draaien in productie op Vercel. Fase 6 levert: een Overuren-tab op het dossier met automatische berekening (werkelijk gewerkte netto-uren uit het rooster minus contracturen, per kalenderdag herleid — ook als rooster of contract halverwege de periode wijzigt), een overzicht van huidige maand/lopend jaar/openstaand saldo, en de volledige statusworkflow (geregistreerd → goedgekeurd → aangeboden aan salarisadministratie met percentage 100/125/150/200% óf tijd-voor-tijd → verwerkt → uitbetaald). Leidinggevenden mogen alleen goedkeuren; salarisverwerking is voorbehouden aan HR/Beheerder (UI-gated — een RLS-verharding hiervan staat als vervolgtaak open, zie de gespawnde taakchip). Zie de roadmap in het functioneel ontwerp voor de volgende fases (verlof, verzuim, dashboards, Resend, AFAS-voorbereiding).

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
