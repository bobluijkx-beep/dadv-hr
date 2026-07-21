"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error: string | null; success?: boolean };

function fail(message: string): ActionState {
  return { error: message };
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const categorySchema = z.enum([
  "arbeidsovereenkomst",
  "addendum",
  "id_document",
  "certificaat",
  "functioneringsgesprek",
  "beoordelingsgesprek",
  "verzuimdocument",
  "overig",
]);

// ---------------------------------------------------------------------
// Nieuw document (eerste versie)
// ---------------------------------------------------------------------

const uploadDocumentSchema = z.object({
  employeeId: z.guid(),
  category: categorySchema,
});

export async function uploadDocument(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Kies een bestand om te uploaden.");
  }

  const parsed = uploadDocumentSchema.safeParse({
    employeeId: formData.get("employeeId"),
    category: formData.get("category"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Niet ingelogd.");

  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({ employee_id: parsed.data.employeeId, category: parsed.data.category, created_by: user.id })
    .select("id")
    .single();
  if (docError) return fail("Aanmaken document mislukt: " + docError.message);

  const path = `${parsed.data.employeeId}/${document.id}/1-${sanitizeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return fail("Uploaden mislukt: " + uploadError.message);

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: document.id,
    version_number: 1,
    storage_path: path,
    file_name: file.name,
    uploaded_by: user.id,
  });
  if (versionError) return fail("Bestand geüpload, maar vastleggen mislukt: " + versionError.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Nieuwe versie van een bestaand document
// ---------------------------------------------------------------------

const uploadVersionSchema = z.object({
  documentId: z.guid(),
  employeeId: z.guid(),
});

export async function uploadNewVersion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Kies een bestand om te uploaden.");
  }

  const parsed = uploadVersionSchema.safeParse({
    documentId: formData.get("documentId"),
    employeeId: formData.get("employeeId"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Ongeldige invoer.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Niet ingelogd.");

  const { data: existingVersions, error: versionsError } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", parsed.data.documentId)
    .order("version_number", { ascending: false })
    .limit(1);
  if (versionsError) return fail("Ophalen versiegeschiedenis mislukt: " + versionsError.message);

  const nextVersion = (existingVersions?.[0]?.version_number ?? 0) + 1;
  const path = `${parsed.data.employeeId}/${parsed.data.documentId}/${nextVersion}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return fail("Uploaden mislukt: " + uploadError.message);

  const { error: insertError } = await supabase.from("document_versions").insert({
    document_id: parsed.data.documentId,
    version_number: nextVersion,
    storage_path: path,
    file_name: file.name,
    uploaded_by: user.id,
  });
  if (insertError) return fail("Bestand geüpload, maar vastleggen mislukt: " + insertError.message);

  revalidatePath(`/medewerkers/${parsed.data.employeeId}`);
  revalidatePath("/mijn-gegevens");
  return { error: null, success: true };
}

// ---------------------------------------------------------------------
// Downloaden — signed URL, pas nadat RLS de metadata-rij heeft toegelaten
// ---------------------------------------------------------------------

export async function getDownloadUrl(documentVersionId: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  // Runs with the caller's own RLS scope: if they can't see this version's
  // metadata row (e.g. a manager and a verzuimdocument), this returns
  // nothing and we stop — the signed URL below is never generated.
  const { data: version, error } = await supabase
    .from("document_versions")
    .select("storage_path")
    .eq("id", documentVersionId)
    .maybeSingle();

  if (error || !version) {
    return { url: null, error: "Geen toegang tot dit document." };
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("documents")
    .createSignedUrl(version.storage_path, 60);

  if (signError || !signed) {
    return { url: null, error: "Downloadlink genereren mislukt." };
  }

  return { url: signed.signedUrl, error: null };
}
