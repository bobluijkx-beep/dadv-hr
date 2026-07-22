import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  getEmployeeCore,
  getCurrentAddress,
  getAddressHistory,
  getCurrentContact,
  getContactHistory,
  getPrivateDetails,
  getChildren,
  getDepartments,
  getManagerOptions,
  decryptBsn,
} from "@/lib/services/employees";
import {
  getContractsForEmployee,
  getCompensationForContracts,
  getSalaryHistory,
} from "@/lib/services/contracts";
import { getDocuments, getVersionsForDocuments } from "@/lib/services/documents";
import { getBreakRules, getSchedulePeriods, getScheduleDays } from "@/lib/services/schedules";
import { getOvertimeEntries, computeOvertimeSummary } from "@/lib/services/overtime";
import { getLeaveTypes, getLeaveBalances, getLeaveRequests } from "@/lib/services/leave";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PersonalInfoForm,
  BsnField,
  WorkInfoForm,
  AddressForm,
  ContactForm,
  PrivateDetailsForm,
  ChildrenList,
} from "@/components/employees/dossier-forms";
import { ContractCard, NewContractForm, SalaryHistoryTable } from "@/components/employees/contract-forms";
import {
  UploadDocumentForm,
  NewVersionForm,
  DownloadButton,
  categoryLabels,
} from "@/components/employees/document-forms";
import {
  CurrentScheduleCard,
  NewSchedulePeriodForm,
  ScheduleHistoryList,
} from "@/components/employees/schedule-forms";
import {
  OvertimeSummary,
  NewOvertimeEntryForm,
  OvertimeEntryRow,
} from "@/components/employees/overtime-forms";
import {
  LeaveBalanceCards,
  StartLeaveYearForm,
  NewLeaveRequestForm,
  LeaveRequestRow,
} from "@/components/employees/leave-forms";

export default async function MedewerkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const employee = await getEmployeeCore(supabase, id).catch(() => null);
  if (!employee) notFound();

  const isSelf = profile.employee_id === id;
  const canEditCore = profile.role === "admin" || profile.role === "hr";
  const canEditContact = canEditCore || isSelf;
  const canSeePrivate = canEditCore || isSelf;

  const [address, addressHistory, contact, contactHistory, departments, managerOptions] = await Promise.all([
    getCurrentAddress(supabase, id),
    getAddressHistory(supabase, id),
    getCurrentContact(supabase, id),
    getContactHistory(supabase, id),
    getDepartments(supabase),
    getManagerOptions(supabase),
  ]);

  const [privateDetails, children] = canSeePrivate
    ? await Promise.all([getPrivateDetails(supabase, id), getChildren(supabase, id)])
    : [null, []];

  const bsn = canEditCore ? await decryptBsn(supabase, employee.bsn_encrypted).catch(() => null) : null;

  const contracts = await getContractsForEmployee(supabase, id);
  const [compensationMap, salaryHistory] = canEditCore
    ? await Promise.all([
        getCompensationForContracts(supabase, contracts.map((c) => c.id)),
        getSalaryHistory(supabase, id),
      ])
    : [new Map(), []];

  const documents = await getDocuments(supabase, id);
  const versionsByDocument = await getVersionsForDocuments(supabase, documents.map((d) => d.id));
  const canUploadDocuments = canEditCore || isSelf;

  const canEditSchedule = canEditCore || profile.role === "manager";
  const schedulePeriods = await getSchedulePeriods(supabase, id);
  const currentPeriod = schedulePeriods.find((p) => p.end_date === null) ?? null;
  const [currentScheduleDays, breakRules] = await Promise.all([
    currentPeriod ? getScheduleDays(supabase, currentPeriod.id) : Promise.resolve([]),
    getBreakRules(supabase, profile.organization_id),
  ]);
  const contractHoursPerWeek = contracts[0]?.hours_per_week ?? null;

  const canSubmitOvertime = canEditCore || isSelf;
  const canApproveOvertime = canEditCore || profile.role === "manager";
  const canProcessOvertimePayroll = canEditCore;
  const overtimeEntries = await getOvertimeEntries(supabase, id);
  const overtimeSummary = computeOvertimeSummary(overtimeEntries);

  const canRequestLeave = canEditCore || isSelf;
  const canApproveLeave = canEditCore || profile.role === "manager";
  const canManageLeave = canEditCore;
  const currentYear = new Date().getFullYear();
  const [leaveTypes, leaveBalances, leaveRequests] = await Promise.all([
    getLeaveTypes(supabase, profile.organization_id),
    getLeaveBalances(supabase, id, currentYear),
    getLeaveRequests(supabase, id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {employee.first_name} {employee.insertion ? `${employee.insertion} ` : ""}
            {employee.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {employee.job_title ?? "Geen functie"} · {employee.employee_number}
          </p>
        </div>
        <Badge variant={employee.is_active ? "default" : "secondary"}>
          {employee.is_active ? "Actief" : "Inactief"}
        </Badge>
      </div>

      <Tabs defaultValue="persoonlijk">
        <TabsList>
          <TabsTrigger value="persoonlijk">Persoonlijk</TabsTrigger>
          {canSeePrivate && <TabsTrigger value="prive">Privé</TabsTrigger>}
          <TabsTrigger value="werk">Werk</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="rooster">Rooster</TabsTrigger>
          <TabsTrigger value="overuren">Overuren</TabsTrigger>
          <TabsTrigger value="verlof">Verlof</TabsTrigger>
          <TabsTrigger value="documenten">Documenten</TabsTrigger>
        </TabsList>

        <TabsContent value="persoonlijk" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Persoonlijke gegevens</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PersonalInfoForm data={{ employeeId: id, ...employee }} editable={canEditCore} />
              {canEditCore && (
                <BsnField employeeId={id} hasBsn={Boolean(employee.bsn_encrypted)} decrypted={bsn} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adres</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {canEditContact ? (
                <AddressForm employeeId={id} current={address} />
              ) : (
                <p className="text-sm">
                  {address ? `${address.street}, ${address.postal_code} ${address.city}` : "Geen adres bekend."}
                </p>
              )}
              {addressHistory.length > 1 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Adreshistorie ({addressHistory.length})</summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {addressHistory.map((a) => (
                      <li key={a.id}>
                        {a.street}, {a.postal_code} {a.city} ({a.valid_from} – {a.valid_to ?? "heden"})
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contactgegevens</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {canEditContact ? (
                <ContactForm employeeId={id} current={contact} />
              ) : (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Telefoon</dt>
                  <dd>{contact?.phone ?? "—"}</dd>
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd>{contact?.email ?? "—"}</dd>
                </dl>
              )}
              {contactHistory.length > 1 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">Contacthistorie ({contactHistory.length})</summary>
                  <ul className="mt-2 flex flex-col gap-1">
                    {contactHistory.map((c) => (
                      <li key={c.id}>
                        {c.phone ?? "—"} · {c.email ?? "—"} ({c.valid_from} – {c.valid_to ?? "heden"})
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canSeePrivate && (
          <TabsContent value="prive" className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Privégegevens</CardTitle>
              </CardHeader>
              <CardContent>
                <PrivateDetailsForm employeeId={id} current={privateDetails} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kinderen</CardTitle>
              </CardHeader>
              <CardContent>
                <ChildrenList employeeId={id} kids={children} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="werk">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Werkgegevens</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkInfoForm
                data={{ employeeId: id, ...employee }}
                editable={canEditCore}
                departments={departments}
                managerOptions={managerOptions}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract" className="flex flex-col gap-6">
          {contracts.length === 0 && (
            <p className="text-sm text-muted-foreground">Nog geen contracten geregistreerd.</p>
          )}
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              employeeId={id}
              contract={contract}
              compensation={compensationMap.get(contract.id) ?? null}
              editable={canEditCore}
            />
          ))}
          {canEditCore && <NewContractForm employeeId={id} />}

          {canEditCore && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salarishistorie</CardTitle>
              </CardHeader>
              <CardContent>
                <SalaryHistoryTable rows={salaryHistory} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rooster" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Huidig rooster</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <CurrentScheduleCard
                days={currentScheduleDays}
                breakRules={breakRules}
                contractHoursPerWeek={contractHoursPerWeek}
              />
              <ScheduleHistoryList periods={schedulePeriods} />
            </CardContent>
          </Card>

          {canEditSchedule && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nieuw rooster vastleggen</CardTitle>
              </CardHeader>
              <CardContent>
                <NewSchedulePeriodForm employeeId={id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overuren" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overzicht</CardTitle>
            </CardHeader>
            <CardContent>
              <OvertimeSummary summary={overtimeSummary} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registraties</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {overtimeEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">Nog geen overuren geregistreerd.</p>
              )}
              {overtimeEntries.map((entry) => (
                <OvertimeEntryRow
                  key={entry.id}
                  entry={entry}
                  employeeId={id}
                  canApprove={canApproveOvertime}
                  canProcessPayroll={canProcessOvertimePayroll}
                />
              ))}
            </CardContent>
          </Card>

          {canSubmitOvertime && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overuren registreren</CardTitle>
              </CardHeader>
              <CardContent>
                <NewOvertimeEntryForm employeeId={id} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verlof" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saldo {currentYear}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <LeaveBalanceCards leaveTypes={leaveTypes} balances={leaveBalances} year={currentYear} />
              {canManageLeave && <StartLeaveYearForm employeeId={id} year={currentYear} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aanvragen</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {leaveRequests.length === 0 && (
                <p className="text-sm text-muted-foreground">Nog geen verlof aangevraagd.</p>
              )}
              {leaveRequests.map((request) => (
                <LeaveRequestRow
                  key={request.id}
                  request={request}
                  employeeId={id}
                  leaveTypeName={leaveTypes.find((t) => t.id === request.leave_type_id)?.name ?? "Onbekend"}
                  canApprove={canApproveLeave}
                  canManage={canManageLeave}
                />
              ))}
            </CardContent>
          </Card>

          {canRequestLeave && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verlof aanvragen</CardTitle>
              </CardHeader>
              <CardContent>
                <NewLeaveRequestForm employeeId={id} leaveTypes={leaveTypes} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="documenten" className="flex flex-col gap-6">
          {canUploadDocuments && <UploadDocumentForm employeeId={id} />}

          {documents.length === 0 && (
            <p className="text-sm text-muted-foreground">Nog geen documenten geüpload.</p>
          )}
          {documents.map((doc) => {
            const versions = versionsByDocument.get(doc.id) ?? [];
            const [current, ...older] = versions;
            return (
              <Card key={doc.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">{categoryLabels[doc.category] ?? doc.category}</CardTitle>
                    <p className="text-xs text-muted-foreground">{current?.file_name ?? "Geen bestand"}</p>
                  </div>
                  {current && <DownloadButton documentVersionId={current.id} label="Downloaden" />}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {canUploadDocuments && <NewVersionForm documentId={doc.id} employeeId={id} />}
                  {older.length > 0 && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Eerdere versies ({older.length})</summary>
                      <ul className="mt-2 flex flex-col gap-2">
                        {older.map((v) => (
                          <li key={v.id} className="flex items-center gap-2">
                            <span>
                              v{v.version_number} — {v.file_name}
                            </span>
                            <DownloadButton documentVersionId={v.id} label="Download" />
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
