import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getPlayer } from "@/lib/dupr-api";

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
    const data = await getPlayer(token, parseInt(id));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
