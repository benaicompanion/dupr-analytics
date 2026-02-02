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
    const data = await getRatingHistory(token, parseInt(id), type);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get rating history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
