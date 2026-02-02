import { NextResponse } from "next/server";
import { getToken, getUser } from "@/lib/auth";
import { getMatchHistory, getRatingHistory } from "@/lib/dupr-api";
import { processMatches } from "@/lib/analytics";

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
    const matches = historyData?.result?.hits || [];
    
    // Try processing matches
    const processed = processMatches(matches, playerId);
    
    // Debug: check first match team players
    const firstMatch = matches[0];
    const teamPlayerIds = firstMatch?.teams?.map((t: Record<string, unknown>) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player1Id: (t.player1 as any)?.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player1IdType: typeof (t.player1 as any)?.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player2Id: (t.player2 as any)?.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      player2IdType: typeof (t.player2 as any)?.id,
    }));

    return NextResponse.json({
      user,
      playerId,
      playerIdType: typeof playerId,
      matchCount: matches.length,
      processedCount: processed.length,
      firstProcessed: processed[0] || null,
      teamPlayerIds,
      userIdString: String(playerId),
      matchPlayerIdString: String(firstMatch?.teams?.[1]?.player2?.id),
      match: firstMatch?.teams?.[1]?.player2?.id === playerId,
      strictMatch: firstMatch?.teams?.[1]?.player2?.id === playerId,
      stringMatch: String(firstMatch?.teams?.[1]?.player2?.id) === String(playerId),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Debug failed";
    return NextResponse.json({ error: message, user }, { status: 500 });
  }
}
