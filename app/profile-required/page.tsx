import { AlertTriangle, ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction, getCurrentUser } from "@/lib/services/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfileRequiredPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="medical-grid flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle>Profile mapping required</CardTitle>
          <CardDescription>
            You are signed in to Supabase Auth, but Medimade HMS cannot find an active hospital profile for this Auth user.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="warning">
            <AlertTitle>Signed-in Auth user</AlertTitle>
            <AlertDescription>
              Auth user ID: <span className="font-mono">{user.id}</span>
              <br />
              Email: <span className="font-mono">{user.email ?? "No email"}</span>
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ClipboardList className="h-4 w-4 text-primary" />
              Check this in Supabase SQL Editor
            </div>
            <pre className="overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-700">
{`select auth_user_id, hospital_id, full_name, email, role, is_active
from public.profiles
where auth_user_id = '${user.id}';`}
            </pre>
          </div>

          <p className="text-sm text-muted-foreground">
            Make sure the row exists, `is_active` is true, and `hospital_id` points to an existing hospital. If the row uses a different `auth_user_id`, update it to the Auth user ID shown above.
          </p>

          <form action={logoutAction}>
            <Button variant="outline" type="submit">Sign out</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
