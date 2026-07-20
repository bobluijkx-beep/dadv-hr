import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

const roleLabels: Record<string, string> = {
  admin: "Beheerder",
  hr: "HR",
  manager: "Leidinggevende",
  employee: "Medewerker",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  const supabase = await createClient();
  const { data: employee } = profile.employee_id
    ? await supabase
        .from("employees")
        .select("first_name, last_name")
        .eq("id", profile.employee_id)
        .single()
    : { data: null };

  const displayName = employee ? `${employee.first_name} ${employee.last_name}` : "Onbekend";

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-none flex-col justify-between border-r bg-muted/20 p-4">
        <div className="flex flex-col gap-6">
          <div className="px-2">
            <p className="font-semibold">HR Portal</p>
            <p className="text-xs text-muted-foreground">{roleLabels[profile.role] ?? profile.role}</p>
          </div>
          <AppNav role={profile.role} />
        </div>
        <div className="flex flex-col gap-2 px-2">
          <p className="truncate text-sm text-muted-foreground">{displayName}</p>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Uitloggen
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
