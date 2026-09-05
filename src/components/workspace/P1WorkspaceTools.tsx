"use client";

import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Info, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FlightEvent = { label: string; detail: string; status: "complete" | "active" | "pending" | "failed"; at?: string };

export function FlightRecorder({ events = [] }: { events?: FlightEvent[] }) {
  const fallback: FlightEvent[] = [
    { label: "Workspace ready", detail: "Project state is synchronized", status: "complete" },
    { label: "Preview health", detail: "Waiting for the next operation", status: "pending" },
  ];
  const timeline = events.length ? events : fallback;
  return <section className="border-border bg-card/80 rounded-xl border p-3" aria-label="Operation timeline">
    <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Flight Recorder</p><p className="text-muted-foreground text-xs">A clear timeline for your project operations</p></div><Clock3 className="text-muted-foreground size-4" aria-hidden /></div>
    <ol className="space-y-3">{timeline.map((event, index) => <li key={`${event.label}-${index}`} className="flex gap-3"><span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", event.status === "complete" && "bg-emerald-500/15 text-emerald-600", event.status === "active" && "bg-primary/15 text-primary", event.status === "failed" && "bg-destructive/15 text-destructive", event.status === "pending" && "bg-muted text-muted-foreground")}>{event.status === "complete" ? <CheckCircle2 className="size-3" /> : event.status === "failed" ? <XCircle className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}</span><div className="min-w-0"><p className="text-xs font-medium">{event.label}</p><p className="text-muted-foreground text-xs leading-5">{event.detail}{event.at ? ` · ${event.at}` : ""}</p></div></li>)}</ol>
  </section>;
}

export function BuildHealthCoach({ error }: { error?: string | null }) {
  const [open, setOpen] = useState(false);
  const analysis = useMemo(() => {
    const value = (error || "").toLowerCase();
    if (value.includes("auth") || value.includes("401") || value.includes("403")) return { category: "Authentication", cause: "The request was rejected before the project operation could start.", action: "Check your session and project access, then retry.", tone: "warning" };
    if (value.includes("database") || value.includes("connection")) return { category: "Database", cause: "The app could not establish a database connection.", action: "Check the database connection and required environment variables.", tone: "warning" };
    if (value.includes("sandbox") || value.includes("timeout")) return { category: "Runtime", cause: "The project runtime is waking up or did not respond in time.", action: "Wait for the preview to become ready, then retry once.", tone: "info" };
    return { category: "Build health", cause: "There is not enough diagnostic information yet to identify a root cause.", action: "Open Logs, capture the latest failure, and try again.", tone: "info" };
  }, [error]);
  return <section className="border-border bg-card/80 rounded-xl border p-3"><div className="flex items-start justify-between gap-3"><div className="flex gap-2"><Sparkles className="text-primary mt-0.5 size-4" aria-hidden /><div><p className="text-sm font-semibold">Build Health Coach</p><p className="text-muted-foreground text-xs">Safe, explainable guidance for the next step</p></div></div><Button variant="ghost" size="sm" onClick={() => setOpen(v => !v)}>{open ? "Hide" : "Explain"}</Button></div>{open && <div className="border-border bg-muted/30 mt-3 space-y-2 rounded-lg border p-3"><p className="text-xs font-semibold">{analysis.category}</p><p className="text-muted-foreground text-xs leading-5">{analysis.cause}</p><p className="text-xs leading-5"><span className="font-medium">Recommended:</span> {analysis.action}</p><p className="text-muted-foreground flex items-center gap-1 text-[11px]"><Info className="size-3" />No automatic changes were made.</p></div>}</section>;
}

export function SafeActionCenter({ action, description, onConfirm, children }: { action: string; description: string; onConfirm: () => void; children: ReactNode }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  async function confirm() { setBusy(true); try { await onConfirm(); setConfirming(false); } finally { setBusy(false); } }
  if (confirming) return <div className="border-warning/40 bg-warning-subtle rounded-xl border p-3"><div className="flex gap-2"><ShieldCheck className="text-warning mt-0.5 size-4" /><div><p className="text-sm font-semibold">Confirm {action}</p><p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p></div></div><div className="mt-3 flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>Cancel</Button><Button variant="destructive" size="sm" onClick={confirm} disabled={busy}>{busy ? "Working…" : `Confirm ${action}`}</Button></div></div>;
  return <div onClick={() => setConfirming(true)}>{children}</div>;
}

export function PreviewTrustBadge({ cached, previewUrl, liveReady = true }: { cached: boolean; previewUrl: string | null; liveReady?: boolean }) {
  const label = !previewUrl ? "No preview" : cached ? "Cached snapshot" : liveReady ? "Live development" : "Starting preview";
  const Icon = !previewUrl || cached ? AlertTriangle : CheckCircle2;
  return <div className="border-border bg-background/90 text-foreground absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] shadow-sm backdrop-blur"><Icon className={cn("size-3", cached || !previewUrl ? "text-warning" : "text-emerald-500")} aria-hidden /><span>{label}</span>{cached && <span className="text-muted-foreground">· editing unavailable</span>}</div>;
}

export function P1EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="text-muted-foreground flex items-center gap-2 text-xs"><AlertTriangle className="size-3.5" />{title}: {detail}</div>; }
