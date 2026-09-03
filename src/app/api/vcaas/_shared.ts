import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projectAccess } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export { isRoutableProjectSlug } from "@/lib/project-slug";

export interface VcaasContext {
  accountUserId: string;
}

export interface VcaasAuthOk {
  ok: true;
  ctx: VcaasContext;
  team: { userId: string; role: string };
}

export type VcaasAuthResult = VcaasAuthOk | { ok: false; response: NextResponse };
export type VcaasAuthFailed = Extract<VcaasAuthResult, { ok: false }>;

export function authFailed(result: VcaasAuthResult): result is VcaasAuthFailed {
  return result.ok === false;
}

export async function resolveVcaasContext(): Promise<VcaasAuthResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
  return {
    ok: true,
    ctx: { accountUserId: session.user.id },
    team: { userId: session.user.id, role: "owner" },
  };
}

export async function enforceProjectScope(
  team: VcaasAuthOk["team"],
  method: string,
  path: string[],
): Promise<NextResponse | null> {
  const projectId = path[0] === "projects" ? path[1] : undefined;
  if (!projectId) return null;

  const access = await db
    .select({ role: projectAccess.role })
    .from(projectAccess)
    .where(and(eq(projectAccess.projectId, projectId), eq(projectAccess.userId, team.userId)))
    .limit(1);

  if (!access[0]) {
    return NextResponse.json(
      { ok: false, error: "Project not found" },
      { status: 404 },
    );
  }

  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
  if (isWrite && !["owner", "editor"].includes(access[0].role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function getOwnedProjectIds(userId: string) {
  const rows = await db
    .select({ projectId: projectAccess.projectId })
    .from(projectAccess)
    .where(eq(projectAccess.userId, userId));
  return new Set(rows.map((row) => row.projectId));
}

export async function claimProject(projectId: string, userId: string) {
  const existing = await db
    .select({ id: projectAccess.id })
    .from(projectAccess)
    .where(and(eq(projectAccess.projectId, projectId), eq(projectAccess.userId, userId)))
    .limit(1);
  if (existing[0]) return;
  await db.insert(projectAccess).values({
    id: crypto.randomUUID(),
    projectId,
    userId,
    role: "owner",
  });
}
