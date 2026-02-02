import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getRatingHistory } from "@/lib/dupr-api";

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
    const type = (req.nextUrl.searchParams.get("type") as "SINGLES" | "DOUBLES") || "DOUBLES";
    console.log("[DUPR Rating History] Fetching for player:", id, "type:", type);
    const data = await getRatingHistory(token, parseInt(id), type);
    console.log("[DUPR Rating History] Response keys:", Object.keys(data || {}));
    console.log("[DUPR Rating History] Result type:", typeof data?.result, "isArray:", Array.isArray(data?.result));
    if (data?.result) {
      const r = data.result;
      console.log("[DUPR Rating History] Result keys:", Object.keys(r));
      if (r.hits) console.log("[DUPR Rating History] hits count:", r.hits.length);
      if (Array.isArray(r)) console.log("[DUPR Rating History] array length:", r.length);
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get rating history";
    console.error("[DUPR Rating History] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
