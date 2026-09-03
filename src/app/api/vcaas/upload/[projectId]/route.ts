import { NextRequest, NextResponse } from "next/server";
import { vcaasUploadRequest } from "@/lib/vcaas-server";
import { authFailed, enforceProjectScope, isRoutableProjectSlug, rateLimitResponse, resolveVcaasContext } from "../../_shared";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const auth = await resolveVcaasContext();
  if (authFailed(auth)) return auth.response;
  const limited = rateLimitResponse(`${auth.team.userId}:upload`);
  if (limited) return limited;
  const { projectId } = await params;
  if (!isRoutableProjectSlug(projectId)) return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
  const outOfScope = await enforceProjectScope(auth.team, "POST", ["projects", projectId]);
  if (outOfScope) return outOfScope;

  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    const maxUploadBytes = 25 * 1024 * 1024;
    if (contentLength > maxUploadBytes) {
      return NextResponse.json({ ok: false, error: "Upload exceeds the 25 MB limit", code: "VALIDATION", data: null }, { status: 413 });
    }
    // Forward the multipart form data straight through to the VCaaS endpoint.
    const formData = await req.formData();
    const files = [...formData.values()].filter((value): value is File => value instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ ok: false, error: "No file provided", code: "VALIDATION", data: null }, { status: 400 });
    }
    if (files.some((file) => file.size > maxUploadBytes)) {
      return NextResponse.json({ ok: false, error: "A file exceeds the 25 MB limit", code: "VALIDATION", data: null }, { status: 413 });
    }
    const response = await vcaasUploadRequest(
      `/projects/${projectId}/files/upload`,
      formData
    );

    const json = (await response.json()) as { errors: { errorCode: string; errorMessage: string } | null; data: unknown };

    if (json.errors) {
      return NextResponse.json(
        { ok: false, error: json.errors.errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data: json.data });
  } catch {
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
