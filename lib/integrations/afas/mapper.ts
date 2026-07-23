import type { AfasEmployeeRecord, AfasContractRecord } from "./types";

/**
 * Pure field mapping, no I/O — keeps the eventual real client and this
 * shape-translation independently testable. BSN is passed in already
 * decrypted by the caller (via decrypt_bsn(), admin/hr-only per §7.2) —
 * this function never touches bsn_encrypted or calls the RPC itself.
 */
export function employeeToAfasRecord(employee: {
  employee_number: string;
  first_name: string;
  insertion: string | null;
  last_name: string;
  date_of_birth: string;
  bsn: string;
  iban: string | null;
  job_title: string | null;
  department_name: string | null;
  employment_start_date: string;
  employment_end_date: string | null;
}): AfasEmployeeRecord {
  return {
    personeelsnummer: employee.employee_number,
    voornaam: employee.first_name,
    tussenvoegsel: employee.insertion,
    achternaam: employee.last_name,
    geboortedatum: employee.date_of_birth,
    bsn: employee.bsn,
    iban: employee.iban,
    functie: employee.job_title,
    afdeling: employee.department_name,
    datumInDienst: employee.employment_start_date,
    datumUitDienst: employee.employment_end_date,
  };
}

export function contractToAfasRecord(
  employeeNumber: string,
  contract: {
    contract_number: string;
    start_date: string;
    end_date: string | null;
    contract_type: string;
    hours_per_week: number;
    salary_amount: number | null;
    salary_scale: string | null;
  },
): AfasContractRecord {
  return {
    personeelsnummer: employeeNumber,
    contractnummer: contract.contract_number,
    ingangsdatum: contract.start_date,
    einddatum: contract.end_date,
    contractsoort: contract.contract_type,
    uren: contract.hours_per_week,
    salaris: contract.salary_amount,
    salarisschaal: contract.salary_scale,
  };
}
