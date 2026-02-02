import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getMatchHistory } from "@/lib/dupr-api";

export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "25"), 25);

    console.log("[DUPR History] Fetching page offset:", offset, "limit:", limit, "player:", id);
    const data = await getMatchHistory(token, parseInt(id), offset, limit);
    const hits = data?.result?.hits || [];
    const total = data?.result?.total || 0;

    console.log("[DUPR History] Got", hits.length, "hits, total:", total);

    return NextResponse.json({
      matches: hits,
      total,
      offset,
      limit,
      hasMore: offset + limit < total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get match history";
    console.error("[DUPR History] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
