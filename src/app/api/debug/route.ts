import { NextResponse } from "next/server";
import { getToken, getUser } from "@/lib/auth";
import { getMatchHistory, getRatingHistory } from "@/lib/dupr-api";

export async function GET() {
  const token = await getToken();
  const user = await getUser();
  if (!token || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const playerId = (user.id as number) || (user.duprId as number);

    // Fetch first page of match history
    const historyData = await getMatchHistory(token, playerId, 0, 5);
    const ratingData = await getRatingHistory(token, playerId, "DOUBLES");

    // Return raw API responses for debugging
    return NextResponse.json({
      user,
      playerId,
      historyResponse: historyData,
      ratingHistoryResponse: ratingData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Debug failed";
    return NextResponse.json({ error: message, user }, { status: 500 });
  }
}
