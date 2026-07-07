"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterValues } from "@/lib/validations/auth";

export function RegisterForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      hospitalName: "",
      email: "",
      password: ""
    }
  });

  function onSubmit(values: RegisterValues) {
    startTransition(async () => {
      try {
        setMessage(null);
        const supabase = createClient();
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.fullName,
              hospital_name: values.hospitalName,
              requested_role: "hospital_admin"
            },
            emailRedirectTo: `${window.location.origin}/login`
          }
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        form.reset();
        setMessage("Account request created. Check your email to confirm access.");
      } catch {
        setMessage("Add Supabase environment variables to enable registration.");
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label>Full name</Label>
        <Input autoComplete="name" {...form.register("fullName")} />
        {form.formState.errors.fullName ? (
          <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label>Hospital name</Label>
        <Input autoComplete="organization" {...form.register("hospitalName")} />
        {form.formState.errors.hospitalName ? (
          <p className="text-xs text-destructive">{form.formState.errors.hospitalName.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label>Email</Label>
        <Input autoComplete="email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label>Password</Label>
        <Input autoComplete="new-password" type="password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Create account
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have access?{" "}
        <Link className="font-medium text-primary" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
