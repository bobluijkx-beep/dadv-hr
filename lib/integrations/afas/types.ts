/**
 * §Module 10 (AFAS-voorbereiding): shape of the data we'd exchange with
 * AFAS Profit once a real environment is connected — modelled after AFAS's
 * "Medewerkers"/"Contracten" GetConnector/UpdateConnector concepts, but the
 * exact field names are unverified since no AFAS environment exists yet.
 * Treat these as our side's contract; adjust to match the real connector
 * schema when Fase 11 goes live.
 */

export type AfasEmployeeRecord = {
  personeelsnummer: string;
  voornaam: string;
  tussenvoegsel: string | null;
  achternaam: string;
  geboortedatum: string;
  bsn: string;
  iban: string | null;
  functie: string | null;
  afdeling: string | null;
  datumInDienst: string;
  datumUitDienst: string | null;
};

export type AfasContractRecord = {
  personeelsnummer: string;
  contractnummer: string;
  ingangsdatum: string;
  einddatum: string | null;
  contractsoort: string;
  uren: number;
  salaris: number | null;
  salarisschaal: string | null;
};

export type AfasSyncResult =
  | { success: true; externalId: string }
  | { success: false; error: string };
