import "server-only";
import type { AfasEmployeeRecord, AfasContractRecord, AfasSyncResult } from "./types";

/**
 * §Module 10: the future real client, not implemented. AFAS Profit's
 * GetConnector/UpdateConnector API needs a live environment (AFAS_ENVIRONMENT_ID
 * + AFAS_TOKEN, both still empty placeholders — see .env.example) to even
 * shape correctly, so every method here reports "not configured" rather
 * than guessing an endpoint and silently failing against it.
 */
export class AfasClient {
  private readonly environmentId: string | undefined;
  private readonly token: string | undefined;

  constructor() {
    this.environmentId = process.env.AFAS_ENVIRONMENT_ID;
    this.token = process.env.AFAS_TOKEN;
  }

  get isConfigured() {
    return Boolean(this.environmentId && this.token);
  }

  async pushEmployee(_record: AfasEmployeeRecord): Promise<AfasSyncResult> {
    if (!this.isConfigured) {
      return { success: false, error: "AFAS-koppeling is nog niet geconfigureerd (Fase 11 voorbereiding)." };
    }
    return { success: false, error: "AFAS-koppeling is voorbereid maar nog niet geïmplementeerd." };
  }

  async pushContract(_record: AfasContractRecord): Promise<AfasSyncResult> {
    if (!this.isConfigured) {
      return { success: false, error: "AFAS-koppeling is nog niet geconfigureerd (Fase 11 voorbereiding)." };
    }
    return { success: false, error: "AFAS-koppeling is voorbereid maar nog niet geïmplementeerd." };
  }
}
