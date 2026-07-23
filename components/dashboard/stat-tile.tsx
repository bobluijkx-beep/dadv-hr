import { ChevronRight } from "lucide-react";

/**
 * Two looks, matching the reference: plain KPIs render as a filled brand-
 * colour card ("Zakelijke Samenvatting" style); anything flagged warning/
 * critical (i.e. needs attention) renders as the white card with a coloured
 * left bar instead ("Overzicht van Acties" style) — same component, no
 * caller changes needed since the branch is driven by the existing `tone`.
 */
export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "critical";
}) {
  if (tone) {
    const barClass = tone === "critical" ? "bg-destructive" : "bg-amber-500";
    return (
      <div className="flex items-center gap-4 rounded-2xl bg-card py-3 pr-4 pl-4 ring-1 ring-border">
        <span className={`h-10 w-1.5 shrink-0 rounded-full ${barClass}`} />
        <div className="flex flex-1 items-center justify-between gap-3">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground">
      <p className="text-xs text-primary-foreground/80">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <ChevronRight className="absolute right-3 bottom-3 size-4 text-primary-foreground/50" />
    </div>
  );
}
