import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getAllMatchHistory } from "@/lib/dupr-api";

export const maxDuration = 30;

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
    console.log("[DUPR History] Fetching match history for player ID:", id);
    const matches = await getAllMatchHistory(token, parseInt(id));
    console.log("[DUPR History] Got", matches.length, "matches");
    if (matches.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const first = matches[0] as any;
      console.log("[DUPR History] First match keys:", Object.keys(first));
      console.log("[DUPR History] First match teams:", JSON.stringify(first.teams?.map((t: any) => ({
        player1Id: t.player1?.id,
        player1DuprId: t.player1?.duprId,
        player1Name: t.player1?.fullName,
        winner: t.winner,
        game1: t.game1,
        game2: t.game2,
      }))));
    }
    return NextResponse.json({ matches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get match history";
    console.error("[DUPR History] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
