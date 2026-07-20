# Deployment — Fase 1 (architectuur, database, Auth)

## 1. Lokaal ontwikkelen

Vereist: Node.js 20+, Docker Desktop, [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
npm install
npx supabase init          # alleen nodig als supabase/ nog niet gelinkt is aan de CLI-versie
npx supabase start         # start lokale Postgres/Auth/Storage/Studio in Docker
npx supabase db reset      # past alle migraties + supabase/seed.sql toe
```

`supabase start` print de lokale `API URL`, `anon key` en `service_role key`. Zet die in `.env.local` (kopieer van `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```

Maak daarna het BSN-encryptiegeheim aan (eenmalig, in Supabase Studio SQL editor op `http://127.0.0.1:54323`, of via `psql`):

```sql
select vault.create_secret('<een lange willekeurige waarde>', 'bsn_encryption_key');
```

Start de app:

```bash
npm run dev
```

Log in met een van de seed-accounts (wachtwoord `password123`): `admin@voorbeeld.test`, `hr@voorbeeld.test`, `manager@voorbeeld.test`, `medewerker@voorbeeld.test`.

### Tests

```bash
npx supabase test db       # pgTAP RLS-tests in supabase/tests/database
```

> **Let op:** deze migraties en tests zijn met zorg geschreven en handmatig doorgenomen, maar in deze omgeving kon Docker niet gestart worden om ze daadwerkelijk tegen een draaiende Postgres-instantie uit te voeren. Draai `npx supabase db reset` en `npx supabase test db` lokaal vóórdat je hierop verder bouwt, om te bevestigen dat alles foutloos toepast.

## 2. Supabase-project (productie)

1. Maak een project aan op [supabase.com](https://supabase.com).
2. Koppel de CLI: `npx supabase link --project-ref <project-ref>`.
3. Zet het BSN-encryptiegeheim in Vault (Dashboard → Project Settings → Vault, of via SQL editor zoals hierboven) — **nooit** via een migratie of `.env`-bestand.
4. Push de migraties: `npx supabase db push`.
5. Maak de twee Storage buckets aan (`documents`, `receipts`) — al gedefinieerd in `supabase/config.toml`, worden aangemaakt bij `db push`/`start` lokaal; controleer in productie dat ze bestaan en `public = false` staat.
6. Nodig gebruikers uit via de Supabase Admin API (niet via het publieke signup-formulier — `enable_signup` staat uit):

```ts
await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: { organization_id, role, employee_id },
});
```

De `handle_new_user()`-trigger zet dit automatisch om in een `profiles`-rij.

## 3. Vercel

1. Importeer de GitHub-repository in Vercel.
2. Environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — niet prefixen met `NEXT_PUBLIC_`)
3. Build command en output zijn standaard Next.js — geen aanpassingen nodig.
4. Voeg de Supabase-project-URL toe aan `auth.additional_redirect_urls` (Dashboard → Authentication → URL configuration) zodra het Vercel-domein bekend is.

## 4. GitHub

Standaard Git-repository; geen bijzondere CI is vereist voor Fase 1. Voeg vanaf Fase 2 een GitHub Actions-workflow toe die minimaal `npx tsc --noEmit`, `npm run lint` en `npx supabase test db` draait vóór merge.

## 5. Nog niet gedaan (bewust, buiten scope Fase 1)

- Resend-integratie (Fase 10) — `notification_log`-tabel bestaat al, verzendlogica nog niet.
- AFAS-koppeling (Fase 11) — alleen mapping/log-tabellen, geen live verbinding.
- Geautomatiseerde retentie/purge-scheduling (`purge_soft_deleted()` bestaat, maar wordt nog niet automatisch aangeroepen — zie §11.4 in [functioneel-ontwerp.md](functioneel-ontwerp.md)).
