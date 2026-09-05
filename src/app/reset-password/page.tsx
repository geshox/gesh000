"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (result.error) {
      setError("This reset link is invalid or expired. Request a new one.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/sign-in"), 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">VibeBuild</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a new password with at least 8 characters.</p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {success && <p role="status" className="text-sm text-muted-foreground">Password updated. Redirecting to sign in…</p>}
          <Button type="submit" disabled={pending || !token}>{pending ? "Updating…" : "Update password"}</Button>
        </form>
      </section>
    </main>
  );
}
