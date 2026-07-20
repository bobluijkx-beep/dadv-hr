"use client";

import { useActionState, useState } from "react";
import {
  updatePersonalInfo,
  updateWorkInfo,
  updateEmployeeBsn,
  updateAddress,
  updateContactDetails,
  updatePrivateDetails,
  addChild,
  removeChild,
  type ActionState,
} from "@/app/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = { error: null };

function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return <p className="text-sm text-destructive">{state.error}</p>;
}

function SavedHint({ state }: { state: ActionState }) {
  if (!state.success) return null;
  return <p className="text-sm text-emerald-600">Opgeslagen.</p>;
}

// ---------------------------------------------------------------------
// Persoonlijk
// ---------------------------------------------------------------------

type PersonalInfo = {
  employeeId: string;
  first_name: string;
  insertion: string | null;
  last_name: string;
  preferred_name: string | null;
  gender: string;
  date_of_birth: string | null;
  iban: string | null;
};

export function PersonalInfoForm({ data, editable }: { data: PersonalInfo; editable: boolean }) {
  const [state, formAction, pending] = useActionState(updatePersonalInfo, initialState);

  if (!editable) {
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Naam</dt>
        <dd>
          {data.first_name} {data.insertion ? `${data.insertion} ` : ""}
          {data.last_name}
        </dd>
        <dt className="text-muted-foreground">Roepnaam</dt>
        <dd>{data.preferred_name ?? "—"}</dd>
        <dt className="text-muted-foreground">Geslacht</dt>
        <dd className="capitalize">{data.gender}</dd>
        <dt className="text-muted-foreground">Geboortedatum</dt>
        <dd>{data.date_of_birth ?? "—"}</dd>
      </dl>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={data.employeeId} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">Voornaam</Label>
          <Input id="first_name" name="first_name" defaultValue={data.first_name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="insertion">Tussenvoegsel</Label>
          <Input id="insertion" name="insertion" defaultValue={data.insertion ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Achternaam</Label>
          <Input id="last_name" name="last_name" defaultValue={data.last_name} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preferred_name">Roepnaam</Label>
          <Input id="preferred_name" name="preferred_name" defaultValue={data.preferred_name ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gender">Geslacht</Label>
          <select
            id="gender"
            name="gender"
            defaultValue={data.gender}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="man">Man</option>
            <option value="vrouw">Vrouw</option>
            <option value="anders">Anders</option>
            <option value="onbekend">Onbekend</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_of_birth">Geboortedatum</Label>
          <Input id="date_of_birth" name="date_of_birth" type="date" defaultValue={data.date_of_birth ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="iban">IBAN</Label>
          <Input id="iban" name="iban" defaultValue={data.iban ?? ""} />
        </div>
      </div>
      <FormError state={state} />
      <SavedHint state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Opslaan…" : "Opslaan"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------
// BSN — admin/hr only, masked until explicitly revealed
// ---------------------------------------------------------------------

export function BsnField({
  employeeId,
  hasBsn,
  decrypted,
}: {
  employeeId: string;
  hasBsn: boolean;
  decrypted: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateEmployeeBsn, initialState);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">BSN:</span>
        <span className="font-mono text-sm">{decrypted ?? (hasBsn ? "•••••••••" : "Niet ingevuld")}</span>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          {hasBsn ? "Wijzigen" : "Invullen"}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bsn">BSN</Label>
        <Input id="bsn" name="bsn" placeholder="123456789" className="w-40" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Opslaan…" : "Opslaan"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Annuleren
      </Button>
      <FormError state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------
// Werk
// ---------------------------------------------------------------------

type WorkInfo = {
  employeeId: string;
  job_title: string | null;
  department_id: string | null;
  manager_id: string | null;
  employment_start_date: string | null;
  employment_end_date: string | null;
  is_active: boolean;
};

export function WorkInfoForm({
  data,
  editable,
  departments,
  managerOptions,
}: {
  data: WorkInfo;
  editable: boolean;
  departments: { id: string; name: string }[];
  managerOptions: { id: string; first_name: string; last_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateWorkInfo, initialState);

  const departmentName = departments.find((d) => d.id === data.department_id)?.name ?? "—";
  const managerName = managerOptions.find((m) => m.id === data.manager_id);

  if (!editable) {
    return (
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <dt className="text-muted-foreground">Functie</dt>
        <dd>{data.job_title ?? "—"}</dd>
        <dt className="text-muted-foreground">Afdeling</dt>
        <dd>{departmentName}</dd>
        <dt className="text-muted-foreground">Leidinggevende</dt>
        <dd>{managerName ? `${managerName.first_name} ${managerName.last_name}` : "—"}</dd>
        <dt className="text-muted-foreground">In dienst sinds</dt>
        <dd>{data.employment_start_date ?? "—"}</dd>
        <dt className="text-muted-foreground">Uit dienst per</dt>
        <dd>{data.employment_end_date ?? "—"}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd>{data.is_active ? "Actief" : "Inactief"}</dd>
      </dl>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={data.employeeId} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="job_title">Functie</Label>
          <Input id="job_title" name="job_title" defaultValue={data.job_title ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="department_id">Afdeling</Label>
          <select
            id="department_id"
            name="department_id"
            defaultValue={data.department_id ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Geen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="manager_id">Leidinggevende</Label>
          <select
            id="manager_id"
            name="manager_id"
            defaultValue={data.manager_id ?? ""}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Geen</option>
            {managerOptions
              .filter((m) => m.id !== data.employeeId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={data.is_active}
            className="size-4"
          />
          <Label htmlFor="is_active">Actief in dienst</Label>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employment_start_date">Datum indiensttreding</Label>
          <Input
            id="employment_start_date"
            name="employment_start_date"
            type="date"
            defaultValue={data.employment_start_date ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="employment_end_date">Datum uitdiensttreding</Label>
          <Input
            id="employment_end_date"
            name="employment_end_date"
            type="date"
            defaultValue={data.employment_end_date ?? ""}
          />
        </div>
      </div>
      <FormError state={state} />
      <SavedHint state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Opslaan…" : "Opslaan"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------
// Adres
// ---------------------------------------------------------------------

type Address = { street: string; postal_code: string; city: string; valid_from: string } | null;

export function AddressForm({ employeeId, current }: { employeeId: string; current: Address }) {
  const [state, formAction, pending] = useActionState(updateAddress, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="street">Straat en huisnummer</Label>
          <Input id="street" name="street" defaultValue={current?.street ?? ""} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="postal_code">Postcode</Label>
          <Input id="postal_code" name="postal_code" defaultValue={current?.postal_code ?? ""} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">Woonplaats</Label>
          <Input id="city" name="city" defaultValue={current?.city ?? ""} required />
        </div>
      </div>
      {current && <p className="text-xs text-muted-foreground">Geldig sinds {current.valid_from}</p>}
      <FormError state={state} />
      <SavedHint state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Opslaan…" : "Opslaan"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------
// Contactgegevens
// ---------------------------------------------------------------------

type Contact = {
  phone: string | null;
  email: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
} | null;

export function ContactForm({ employeeId, current }: { employeeId: string; current: Contact }) {
  const [state, formAction, pending] = useActionState(updateContactDetails, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Telefoonnummer</Label>
          <Input id="phone" name="phone" defaultValue={current?.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" name="email" type="email" defaultValue={current?.email ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="emergency_contact_name">Noodcontact — naam</Label>
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={current?.emergency_contact_name ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="emergency_contact_phone">Noodcontact — telefoon</Label>
          <Input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            defaultValue={current?.emergency_contact_phone ?? ""}
          />
        </div>
      </div>
      <FormError state={state} />
      <SavedHint state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Opslaan…" : "Opslaan"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------
// Privé
// ---------------------------------------------------------------------

type PrivateDetails = {
  partner_name: string | null;
  partner_date_of_birth: string | null;
  hobbies: string | null;
  interests: string | null;
  notes: string | null;
} | null;

export function PrivateDetailsForm({ employeeId, current }: { employeeId: string; current: PrivateDetails }) {
  const [state, formAction, pending] = useActionState(updatePrivateDetails, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="employeeId" value={employeeId} />
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partner_name">Naam partner</Label>
          <Input id="partner_name" name="partner_name" defaultValue={current?.partner_name ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="partner_date_of_birth">Geboortedatum partner</Label>
          <Input
            id="partner_date_of_birth"
            name="partner_date_of_birth"
            type="date"
            defaultValue={current?.partner_date_of_birth ?? ""}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hobbies">Hobby&apos;s</Label>
          <Input id="hobbies" name="hobbies" defaultValue={current?.hobbies ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="interests">Interesses</Label>
          <Input id="interests" name="interests" defaultValue={current?.interests ?? ""} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Persoonlijke notities</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={current?.notes ?? ""}
          rows={3}
          className="rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <FormError state={state} />
      <SavedHint state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Opslaan…" : "Opslaan"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------
// Kinderen
// ---------------------------------------------------------------------

type Child = { id: string; name: string; date_of_birth: string | null };

export function ChildrenList({ employeeId, kids }: { employeeId: string; kids: Child[] }) {
  const [state, formAction, pending] = useActionState(addChild, initialState);

  return (
    <div className="flex flex-col gap-3">
      {kids.length === 0 && <p className="text-sm text-muted-foreground">Geen kinderen geregistreerd.</p>}
      {kids.map((child) => (
        <div key={child.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <span>
            {child.name} {child.date_of_birth ? `— ${child.date_of_birth}` : ""}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => removeChild(child.id, employeeId)}
          >
            Verwijderen
          </Button>
        </div>
      ))}
      <form action={formAction} className="flex items-end gap-2">
        <input type="hidden" name="employeeId" value={employeeId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="child_name">Naam</Label>
          <Input id="child_name" name="name" className="w-48" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="child_dob">Geboortedatum</Label>
          <Input id="child_dob" name="date_of_birth" type="date" className="w-40" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Toevoegen…" : "Toevoegen"}
        </Button>
      </form>
      <FormError state={state} />
    </div>
  );
}
