import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";

export default async function MijnGegevensPage() {
  const profile = await requireProfile();

  if (!profile.employee_id) {
    return (
      <p className="text-sm text-muted-foreground">
        Dit account is niet gekoppeld aan een personeelsdossier.
      </p>
    );
  }

  // The dossier detail page already grants full self-access (edit contact
  // details, see privé/kinderen, read-only persoonlijk/werk) once
  // profile.employee_id matches the route id — no separate view needed.
  redirect(`/medewerkers/${profile.employee_id}`);
}
