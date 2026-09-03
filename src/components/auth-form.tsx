"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const result = isSignUp
      ? await authClient.signUp.email({ name, email, password })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError("Unable to authenticate with those details. Please try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email first, then choose Forgot password.");
      return;
    }
    setResetPending(true);
    setError("");
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetPending(false);
    if (result.error) {
      setError("Unable to send a reset email right now. Please try again.");
      return;
    }
    setResetSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">VibeBuild</p>
          <h1 className="text-2xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Welcome back"}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{isSignUp ? "Start building your next app with AI." : "Sign in to access your projects."}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          {isSignUp && <div className="flex flex-col gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" /></div>}
          <div className="flex flex-col gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={isSignUp ? "new-password" : "current-password"} />
            {!isSignUp && <button type="button" onClick={handleForgotPassword} disabled={resetPending} className="self-end text-sm font-medium text-foreground underline underline-offset-4 disabled:opacity-60">{resetPending ? "Sending…" : "Forgot password?"}</button>}
          </div>
          {resetSent && <p role="status" className="text-sm text-muted-foreground">If an account exists for this email, we&apos;ve sent a password reset link.</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>{pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account? " : "New to VibeBuild? "}
          <Link className="font-medium text-foreground underline underline-offset-4" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create one"}</Link>
        </p>
      </section>
    </main>
  );
}
