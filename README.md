# HR Portal

Nederlandse HR Portal MVP — personeelsdossiers, contracten, salaris, roosters, overuren, verlof en verzuim op één plek. Gebouwd met Next.js (App Router), TypeScript, Tailwind, shadcn/ui en Supabase (Postgres, Auth, Storage, Edge Functions, RLS).

## Documentatie

- [Functioneel ontwerp, rollenmodel, ERD, database-/Supabase-schema, security- en RLS-ontwerp](docs/functioneel-ontwerp.md) — het goedgekeurde ontwerp; lees dit voordat je schema of RLS wijzigt.
- [Deployment (lokaal, Supabase, Vercel, GitHub)](docs/deployment.md)

## Status

**Fase 1 t/m 7 zijn klaar** (architectuur/Auth, personeelsdossiers, contractbeheer, documentbeheer, roosters, overuren, verlof) — allemaal geverifieerd tegen een live Supabase-project, en draaien in productie op Vercel. Fase 7 levert: een Verlof-tab op het dossier met jaarlijkse opbouw (4× contracturen/week wettelijk, 1× bovenwettelijk — instelbaar per `leave_types`), een saldo-overzicht (opgebouwd/opgenomen/resterend) met een signaal zodra er na 1 juli nog wettelijk verlof resteert, en de aanvraag-/goedkeuringsworkflow. Aangevraagde uren worden automatisch berekend uit het rooster (dezelfde herbruikbare dagberekening als Overuren). Goedkeuren loopt via een `approve_leave_request()` database-functie (`SECURITY DEFINER`): de RLS beperkt rechtstreekse schrijftoegang tot `leave_transactions`/`leave_balances` bewust tot admin/HR ("ledger integrity"), maar een leidinggevende moet wél kunnen goedkeuren — de functie herverifieert daarom zelf de autorisatie in plaats van op een RLS-check van een andere tabel te vertrouwen.

Tijdens het testen bleek de `break_rules`-tabel op het live project leeg te zijn (waarschijnlijk per ongeluk gewist tijdens het uitproberen van de Instellingen-pagina), waardoor Rooster/Overuren/Verlof-berekeningen tijdelijk geen pauzeaftrek toepasten. De twee standaardregels (>5,5u/-30min, >8u/-45min) zijn hersteld.

**Fase 8 (verzuim)** is ook klaar: een Verzuim-tab op het dossier met basisregistratie (eerste ziektedag, volledig/gedeeltelijk, arbeidsongeschiktheidspercentage, hersteldatum, opmerkingen — admin/HR beheren, medewerker ziet alleen eigen dossier read-only). Leidinggevenden zien uitsluitend `absence_status_view` (status + data, nooit percentage/notities — al zo gebouwd in Fase 1 conform de goedgekeurde §11.2-beslissing, hier voor het eerst écht gebruikt en getest).

**Fase 9 (dashboards)** is klaar: het startscherm toont voor Beheerder/HR/Leidinggevende nu een echt HR-dashboard in plaats van alleen een welkomstkaart — kaarten voor totaal/actieve medewerkers, medewerkers ziek, ziekteverzuimpercentage (dagen-gewogen, niet alleen een koppentelling), gemiddelde verzuimduur, overuren deze maand, openstaande overuren/verlofaanvragen, contracten binnen 90 dagen en verjaardagen komende 30 dagen; een trendgrafiek van overuren over de laatste 6 maanden; en tabellen voor aflopende contracten, verjaardagen en laag verlofsaldo. Alles is automatisch RLS-gescoped — een leidinggevende ziet dezelfde kaarten maar dan beperkt tot het eigen team, zonder dat daar aparte querylogica voor nodig was. Medewerkers houden hun bestaande, simpele welkomstkaart (hun eigen dashboard is al de "Mijn gegevens"-pagina). Het per-medewerker personeelsdashboard uit het functioneel ontwerp was in feite al af — dat is precies wat de dossier-tabs (Persoonlijk t/m Verzuim) al tonen.

**Fase 10 (Resend)** is klaar: een centrale notificatieservice (`lib/services/notifications.ts`) verstuurt de 7 e-mailtypes uit het ontwerp — verlof aangevraagd/goedgekeurd/afgewezen, overuren ingediend/goedgekeurd/aangeboden aan salarisadministratie/verwerkt — en logt elke poging in `notification_log`. Die tabel heeft bewust geen INSERT-policy voor reguliere rollen (alleen admin/HR mogen 'm lezen), dus de service schrijft via de service-role admin-client, nooit via de RLS-scoped client die Server Actions normaal gebruiken. Verzending en logging zijn "fire-and-forget" vanuit de Server Actions: een mislukte e-mail mag de eigenlijke verlof-/overurenactie nooit blokkeren. Getest met een echte Resend-verzending (sandboxmodus, `onboarding@resend.dev`) via de volledige app-flow — bevestigd ontvangen. Voor productieverzending naar échte medewerker-adressen (niet alleen het eigen Resend-accountadres) moet later een eigen domein geverifieerd worden in Resend.

**Fase 11 (AFAS-voorbereiding) is klaar — daarmee zijn alle 11 fases uit de roadmap afgerond.** Conform het ontwerp bevat dit uitsluitend de integratielaag, geen live koppeling: `lib/integrations/afas/types.ts` (het beoogde AFAS Profit-record­formaat, ongeverifieerd tot een echte omgeving beschikbaar is), `mapper.ts` (pure veldmapping), `client.ts` (een `AfasClient`-stub die altijd "niet geconfigureerd/nog niet geïmplementeerd" teruggeeft — er wordt bewust geen gok-URL aangeroepen) en `sync-service.ts` (orchestratie: BSN ontsleutelen, mappen, resultaat loggen naar `integration_mappings`/`integration_sync_log`, tabellen die al in Fase 1 zijn gebouwd). Een read-only "Integraties — AFAS"-sectie op Instellingen (admin) toont de synchronisatiehistorie en heeft een testknop die de volledige pijplijn doorloopt.

Tijdens het testen bleek `integration_sync_log` — net als `notification_log` — bewust geen INSERT-policy voor reguliere rollen te hebben; de eerste versie schreef per ongeluk via de gewone RLS-client en liep vast op een RLS-fout. Opgelost door ook hier de service-role admin-client te gebruiken, zoals bij de notificatieservice.

Zie het functioneel ontwerp voor de volledige roadmap-historie.

**Post-MVP toevoeging:** medewerkers verwijderen vanuit de lijst. Ontworpen als soft delete (§11.4: geen hard delete zonder bewaartermijnbeleid) — `employees.deleted_at` wordt gezet, contracten/audit-log/etc. blijven bewaard. Uit veiligheid alleen mogelijk voor medewerkers die al op "Inactief" staan; de knop verschijnt daarom pas nadat iemand via de Werk-tab is gedeactiveerd. `listEmployees` sluit soft-deleted rijen nu ook expliciet uit (was eerder een latente hiaat, viel alleen op zodra er voor het eerst iets verwijderd moest worden).

**Post-MVP toevoeging: nieuwe huisstijl.** Kleuren/vorm (`app/globals.css`), navigatie (`components/app-nav.tsx`) en een nieuwe bovenbalk (`components/app-header.tsx`) zijn omgezet naar een teal-huisstijl op basis van een aangeleverde referentie-screenshot — de teal-tint is een schatting en later eenvoudig bij te sturen via alleen die tokens. Belangrijkste keuzes:
- Sidebar met iconen (lucide-react) en een witte "actieve pagina"-pil, in plaats van platte tekstlinks.
- Een gedeelde bovenbalk (paginasectie-titel + gebruikersmenu met uitloggen) verving het gebruikersblok onderin de sidebar; overbodig geworden dubbele `<h1>`'s op Medewerkers/Instellingen zijn verwijderd.
- Alle knoppen zijn nu volledig rond (pil-vorm); kaarten/inputs zijn ruimer afgerond via een verhoogde `--radius`-token — dit werkt automatisch door op elke pagina omdat vrijwel alle UI-componenten al de gedeelde design-tokens gebruiken.
- Dashboard-KPI-tegels renderen nu als gevulde teal-kaarten; tegels met een `warning`/`critical`-tone (bijv. "Openstaande overuren") renderen automatisch als de kaart met gekleurde balk links, zonder dat de aanroepende code hoefde te veranderen.
- Lettertype gewijzigd naar Manrope (Google Font). Terzijde ontdekt en gerepareerd: de oorspronkelijke shadcn-scaffold koppelde `--font-sans` nooit daadwerkelijk aan de geladen font-variabele (`--font-geist-sans` ≠ `--font-sans`), dus er werd al sinds Fase 1 stilzwijgend op een browser-standaardlettertype teruggevallen — dat is nu gefixt.
- Dark mode-tokens zijn bijgewerkt maar er is (net als voorheen) geen daadwerkelijke licht/donker-schakelaar in de app; dit was al zo vóór deze wijziging en viel buiten de scope van dit verzoek.

## Snel starten

```bash
npm install
npx supabase start
npx supabase db reset
npm run dev
```

Zie [docs/deployment.md](docs/deployment.md) voor environment variables, het BSN-encryptiegeheim, seed-accounts en productie-deployment.
