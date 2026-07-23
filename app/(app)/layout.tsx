import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { AppHeader } from "@/components/app-header";
import { logout } from "@/app/actions/auth";

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
      <aside className="flex w-64 flex-none flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
        <div className="px-3 pt-2">
          <p className="text-lg font-semibold tracking-tight">HR Portal</p>
        </div>
        <AppNav role={profile.role} />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader
          displayName={displayName}
          roleLabel={roleLabels[profile.role] ?? profile.role}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
