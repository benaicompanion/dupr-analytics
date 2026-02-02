import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getAllMatchHistory } from "@/lib/dupr-api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const matches = await getAllMatchHistory(token, parseInt(id));
    return NextResponse.json({ matches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get match history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
