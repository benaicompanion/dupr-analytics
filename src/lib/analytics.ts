/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MatchRecord {
  matchId: string;
  date: string;
  eventFormat: string;
  partner: { name: string; duprId: number } | null;
  opponents: { name: string; duprId: number }[];
  scores: string;
  won: boolean;
  doublesRating: number | null;
  singlesRating: number | null;
  matchSource: string;
  matchType: string;
}

export interface PartnerStats {
  name: string;
  duprId: number;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface RatingPoint {
  date: string;
  rating: number;
  matchId?: string;
}

export function processMatches(
  matches: any[],
  userId: number
): MatchRecord[] {
  return matches
    .map((match: any) => {
      try {
        const teams = match.teams || [];
        let userTeam: any = null;
        let opponentTeam: any = null;
        let userPlayer: any = null;

        // Match user by id or duprId (compare as strings to handle type mismatches)
        const isUser = (p: any) => {
          const uid = String(userId);
          return String(p.id) === uid || String(p.duprId) === uid;
        };

        for (const team of teams) {
          const players = [team.player1, team.player2].filter(Boolean);
          const found = players.find(isUser);
          if (found) {
            userTeam = team;
            userPlayer = found;
          } else {
            opponentTeam = team;
          }
        }

        if (!userTeam || !userPlayer) return null;

        const teamPlayers = [userTeam.player1, userTeam.player2].filter(Boolean);
        const partner = teamPlayers.find((p: any) => !isUser(p));

        const opponentPlayers = opponentTeam
          ? [opponentTeam.player1, opponentTeam.player2].filter(Boolean)
          : [];

        // Scores can be on team objects (game1, game2, game3) or in a separate games array
        let scoreStr = "N/A";
        if (userTeam && opponentTeam) {
          const scores: string[] = [];
          for (const gameKey of ["game1", "game2", "game3"]) {
            const s1 = userTeam[gameKey];
            const s2 = opponentTeam[gameKey];
            if (s1 != null && s2 != null) {
              scores.push(`${s1}-${s2}`);
            }
          }
          if (scores.length > 0) scoreStr = scores.join(", ");
        }
        if (scoreStr === "N/A" && match.games?.length > 0) {
          scoreStr = match.games
            .map((g: any) => `${g.team1Score ?? g.game1 ?? "?"}-${g.team2Score ?? g.game2 ?? "?"}`)
            .join(", ");
        }

        return {
          matchId: match.matchId || match.id || "",
          date: match.eventDate || match.createdAt || "",
          eventFormat: match.eventFormat || "UNKNOWN",
          partner: partner
            ? { name: partner.fullName || "Unknown", duprId: partner.id || partner.duprId }
            : null,
          opponents: opponentPlayers.map((p: any) => ({
            name: p.fullName || "Unknown",
            duprId: p.id || p.duprId,
          })),
          scores: scoreStr || "N/A",
          won: userTeam.winner === true,
          doublesRating: userPlayer.doubles ?? userPlayer.doublesRating ?? null,
          singlesRating: userPlayer.singles ?? userPlayer.singlesRating ?? null,
          matchSource: match.matchSource || "",
          matchType: match.matchType || "",
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as MatchRecord[];
}

export function getPartnerStats(matches: MatchRecord[]): PartnerStats[] {
  const doublesMatches = matches.filter(
    (m) => m.eventFormat === "DOUBLES" && m.partner
  );
  const partnerMap = new Map<
    number,
    { name: string; duprId: number; wins: number; losses: number }
  >();

  for (const match of doublesMatches) {
    if (!match.partner) continue;
    const key = match.partner.duprId;
    if (!partnerMap.has(key)) {
      partnerMap.set(key, {
        name: match.partner.name,
        duprId: key,
        wins: 0,
        losses: 0,
      });
    }
    const entry = partnerMap.get(key)!;
    if (match.won) entry.wins++;
    else entry.losses++;
  }

  return Array.from(partnerMap.values())
    .map((p) => ({
      ...p,
      matches: p.wins + p.losses,
      winRate: p.wins + p.losses > 0 ? p.wins / (p.wins + p.losses) : 0,
    }))
    .sort((a, b) => b.matches - a.matches);
}

export function buildRatingTimeline(matches: MatchRecord[]): RatingPoint[] {
  const doublesMatches = matches
    .filter((m) => m.eventFormat === "DOUBLES" && m.doublesRating != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return doublesMatches.map((m) => ({
    date: m.date,
    rating: m.doublesRating!,
    matchId: m.matchId,
  }));
}

export function getSummaryStats(matches: MatchRecord[], currentRating?: number) {
  const doublesMatches = matches.filter((m) => m.eventFormat === "DOUBLES");
  const ratings = doublesMatches
    .filter((m) => m.doublesRating != null)
    .map((m) => m.doublesRating!);

  const wins = matches.filter((m) => m.won).length;
  const doublesWins = doublesMatches.filter((m) => m.won).length;

  return {
    currentRating: currentRating ?? (ratings.length > 0 ? ratings[0] : null),
    highestRating: ratings.length > 0 ? Math.max(...ratings) : null,
    lowestRating: ratings.length > 0 ? Math.min(...ratings) : null,
    totalMatches: matches.length,
    doublesMatches: doublesMatches.length,
    totalWins: wins,
    totalLosses: matches.length - wins,
    winRate: matches.length > 0 ? wins / matches.length : 0,
    doublesWinRate:
      doublesMatches.length > 0 ? doublesWins / doublesMatches.length : 0,
  };
}
