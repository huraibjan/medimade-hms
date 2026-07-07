"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { asQueryClient } from "@/lib/supabase/query-client";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";
import { getRoleHomePath } from "@/lib/utils/permissions";
import type { UserRole } from "@/types/database";

type ProfileRoleRow = {
  role: UserRole;
};

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL || "admin@gmail.com";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD || "DemoAdmin2026!";

function getSafeNextPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  if (path === "/login" || path === "/register" || path === "/forgot-password") return null;
  return path;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  function onSubmit(values: LoginValues) {
    startTransition(async () => {
      try {
        setMessage(null);
        const supabase = createClient();
        const { data: authData, error } = await supabase.auth.signInWithPassword(values);
        if (error) {
          setMessage(error.message);
          return;
        }

        const { data: profiles } = await asQueryClient(supabase)
          .from<ProfileRoleRow>("profiles")
          .select("role")
          .eq("auth_user_id", authData.user.id)
          .limit(1);

        const fallbackPath = getRoleHomePath(profiles?.[0]?.role);
        router.push((getSafeNextPath(params.get("next")) ?? fallbackPath) as Route);
        router.refresh();
      } catch {
        setMessage("Add Supabase environment variables to enable sign in.");
      }
    });
  }

  function useDemoCredentials() {
    setMessage(null);
    form.reset({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link className="hover:text-primary" href="/forgot-password">
          Forgot password?
        </Link>
        <Link className="hover:text-primary" href="/register">
          Create account
        </Link>
      </div>
      <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Portfolio demo admin</p>
            <p className="text-xs text-muted-foreground">Use this readied hospital admin account.</p>
          </div>
        </div>
        <div className="grid gap-1 rounded-md bg-background p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Email:</span>{" "}
            <span className="font-medium">{DEMO_EMAIL}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Password:</span>{" "}
            <span className="font-medium">{DEMO_PASSWORD}</span>
          </p>
        </div>
        <Button className="mt-3 w-full" type="button" variant="outline" onClick={useDemoCredentials}>
          Use demo admin
        </Button>
      </div>
    </form>
  );
}
