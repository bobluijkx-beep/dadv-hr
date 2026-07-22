# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 t/m 7 zijn klaar** (architectuur/Auth, personeelsdossiers, contractbeheer, documentbeheer, roosters, overuren, verlof) — allemaal geverifieerd tegen een live Supabase-project, en draaien in productie op Vercel. Fase 7 levert: een Verlof-tab op het dossier met jaarlijkse opbouw (4× contracturen/week wettelijk, 1× bovenwettelijk — instelbaar per `leave_types`), een saldo-overzicht (opgebouwd/opgenomen/resterend) met een signaal zodra er na 1 juli nog wettelijk verlof resteert, en de aanvraag-/goedkeuringsworkflow. Aangevraagde uren worden automatisch berekend uit het rooster (dezelfde herbruikbare dagberekening als Overuren). Goedkeuren loopt via een `approve_leave_request()` database-functie (`SECURITY DEFINER`): de RLS beperkt rechtstreekse schrijftoegang tot `leave_transactions`/`leave_balances` bewust tot admin/HR ("ledger integrity"), maar een leidinggevende moet wél kunnen goedkeuren — de functie herverifieert daarom zelf de autorisatie in plaats van op een RLS-check van een andere tabel te vertrouwen.

Tijdens het testen bleek de `break_rules`-tabel op het live project leeg te zijn (waarschijnlijk per ongeluk gewist tijdens het uitproberen van de Instellingen-pagina), waardoor Rooster/Overuren/Verlof-berekeningen tijdelijk geen pauzeaftrek toepasten. De twee standaardregels (>5,5u/-30min, >8u/-45min) zijn hersteld.

Zie de roadmap in het functioneel ontwerp voor de volgende fases (verzuim, dashboards, Resend, AFAS-voorbereiding).

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
