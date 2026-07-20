import { requireProfile } from "@/lib/auth/session";
import { SetPasswordForm } from "@/components/set-password-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function WachtwoordInstellenPage() {
  await requireProfile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Wachtwoord instellen</CardTitle>
          <CardDescription>Kies een wachtwoord om voortaan mee in te loggen.</CardDescription>
        </CardHeader>
        <CardContent>
          <SetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
