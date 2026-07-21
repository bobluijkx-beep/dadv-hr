"use client";

import { useActionState, useState, useTransition } from "react";
import { uploadDocument, uploadNewVersion, getDownloadUrl, type ActionState } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ActionState = { error: null };

export const categoryLabels: Record<string, string> = {
  arbeidsovereenkomst: "Arbeidsovereenkomst",
  addendum: "Addendum",
  id_document: "ID-document",
  certificaat: "Certificaat",
  functioneringsgesprek: "Functioneringsgesprek",
  beoordelingsgesprek: "Beoordelingsgesprek",
  verzuimdocument: "Verzuimdocument",
  overig: "Overig",
};

function FormError({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return <p className="text-sm text-destructive">{state.error}</p>;
}

// ---------------------------------------------------------------------
// Downloadknop — vraagt pas bij de klik een kortlevende signed URL op
// ---------------------------------------------------------------------

export function DownloadButton({ documentVersionId, label }: { documentVersionId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await getDownloadUrl(documentVersionId);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setError(result.error ?? "Downloaden mislukt.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" size="sm" variant="outline" onClick={handleClick} disabled={pending}>
        {pending ? "Bezig…" : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Nieuw document uploaden
// ---------------------------------------------------------------------

export function UploadDocumentForm({ employeeId }: { employeeId: string }) {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Document uploaden
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Document uploaden</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="employeeId" value={employeeId} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="category">Categorie</Label>
            <select
              id="category"
              name="category"
              defaultValue="overig"
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">Bestand</Label>
            <Input id="file" name="file" type="file" required className="w-64" />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Uploaden…" : "Uploaden"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
        </form>
        <FormError state={state} />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------
// Nieuwe versie van een bestaand document
// ---------------------------------------------------------------------

export function NewVersionForm({ documentId, employeeId }: { documentId: string; employeeId: string }) {
  const [state, formAction, pending] = useActionState(uploadNewVersion, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Nieuwe versie
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <input type="hidden" name="employeeId" value={employeeId} />
      <Input name="file" type="file" required className="w-56" />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Uploaden…" : "Uploaden"}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Annuleren
      </Button>
      <FormError state={state} />
    </form>
  );
}
