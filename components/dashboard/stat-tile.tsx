export function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "critical";
}) {
  const toneClass = tone === "critical" ? "text-destructive" : tone === "warning" ? "text-amber-600 dark:text-amber-500" : "";

  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
