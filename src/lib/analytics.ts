/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MatchRecord {
  matchId: string;
  date: string;
  eventFormat: string;
  partner: { name: string; id: number; duprId: string } | null;
  opponents: { name: string; id: number; duprId: string }[];
  scores: string;
  won: boolean;
  doublesRating: number | null;
  singlesRating: number | null;
  doublesRatingBefore: number | null;
  doublesRatingChange: number | null;
  matchSource: string;
  matchType: string;
  eventName: string;
}

export interface PartnerStats {
  name: string;
  id: number;
  duprId: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  avgDuprChange: number;
  totalDuprChange: number;
}

export interface RatingPoint {
  date: string;
  rating: number;
  matchId?: string;
}

function findUserInTeams(teams: any[], userId: number): { userTeam: any; opponentTeam: any; userPlayer: any } | null {
  let userTeam: any = null;
  let opponentTeam: any = null;
  let userPlayer: any = null;

  const uid = String(userId);

  for (const team of teams) {
    const players = [team.player1, team.player2].filter(Boolean);
    const found = players.find((p: any) => {
      // Match by numeric id, string id, or duprId
      return String(p.id) === uid || String(p.duprId) === uid;
    });
    if (found) {
      userTeam = team;
      userPlayer = found;
    } else {
      opponentTeam = team;
    }
  }

  if (!userTeam || !userPlayer) return null;
  return { userTeam, opponentTeam, userPlayer };
}

export function processMatches(matches: any[], userId: number): MatchRecord[] {
  if (!matches || matches.length === 0 || !userId) return [];

  const uid = String(userId);
  const results: MatchRecord[] = [];

  for (const match of matches) {
    try {
      const teams = match.teams || [];
      if (teams.length === 0) continue;

      const found = findUserInTeams(teams, userId);
      if (!found) {
        // Try matching by fullName as fallback
        continue;
      }

      const { userTeam, opponentTeam, userPlayer } = found;

      // Find partner (other player on user's team)
      const teamPlayers = [userTeam.player1, userTeam.player2].filter(Boolean);
      const partnerPlayer = teamPlayers.find((p: any) => String(p.id) !== uid && String(p.duprId) !== uid);

      // Opponents
      const opponentPlayers = opponentTeam
        ? [opponentTeam.player1, opponentTeam.player2].filter(Boolean)
        : [];

      // Scores - filter out -1 (unplayed games)
      const scores: string[] = [];
      if (userTeam && opponentTeam) {
        for (const gameKey of ["game1", "game2", "game3", "game4", "game5"]) {
          const s1 = userTeam[gameKey];
          const s2 = opponentTeam[gameKey];
          if (s1 != null && s2 != null && s1 >= 0 && s2 >= 0) {
            scores.push(`${s1}-${s2}`);
          }
        }
      }

      // Rating data from preMatchRatingAndImpact
      const impact = userTeam.preMatchRatingAndImpact || {};
      const isPlayer1 = String(userTeam.player1?.id) === uid;
      const preRating = isPlayer1
        ? impact.preMatchDoubleRatingPlayer1
        : impact.preMatchDoubleRatingPlayer2;
      const ratingChange = isPlayer1
        ? impact.matchDoubleRatingImpactPlayer1
        : impact.matchDoubleRatingImpactPlayer2;
      const postRating = userPlayer.postMatchRating?.doubles ?? null;

      results.push({
        matchId: String(match.matchId || match.id || ""),
        date: match.eventDate || match.createdAt || "",
        eventFormat: match.eventFormat || "UNKNOWN",
        partner: partnerPlayer
          ? {
              name: partnerPlayer.fullName || "Unknown",
              id: partnerPlayer.id,
              duprId: partnerPlayer.duprId || "",
            }
          : null,
        opponents: opponentPlayers.map((p: any) => ({
          name: p.fullName || "Unknown",
          id: p.id,
          duprId: p.duprId || "",
        })),
        scores: scores.length > 0 ? scores.join(", ") : "N/A",
        won: userTeam.winner === true,
        doublesRating: postRating,
        singlesRating: userPlayer.postMatchRating?.singles ?? null,
        doublesRatingBefore: preRating ?? null,
        doublesRatingChange: ratingChange ?? null,
        matchSource: match.matchSource || "",
        matchType: match.matchType || "",
        eventName: match.eventName || match.league || "",
      });
    } catch {
      continue;
    }
  }

  return results;
}

export function getPartnerStats(matches: MatchRecord[]): PartnerStats[] {
  const doublesMatches = matches.filter(
    (m) => m.eventFormat === "DOUBLES" && m.partner
  );
  const partnerMap = new Map<
    number,
    { name: string; id: number; duprId: string; wins: number; losses: number; duprChanges: number[] }
  >();

  for (const match of doublesMatches) {
    if (!match.partner) continue;
    const key = match.partner.id;
    if (!partnerMap.has(key)) {
      partnerMap.set(key, {
        name: match.partner.name,
        id: key,
        duprId: match.partner.duprId,
        wins: 0,
        losses: 0,
        duprChanges: [],
      });
    }
    const entry = partnerMap.get(key)!;
    if (match.won) entry.wins++;
    else entry.losses++;
    if (match.doublesRatingChange != null) {
      entry.duprChanges.push(match.doublesRatingChange);
    }
  }

  return Array.from(partnerMap.values())
    .map((p) => {
      const totalMatches = p.wins + p.losses;
      const totalChange = p.duprChanges.reduce((a, b) => a + b, 0);
      return {
        name: p.name,
        id: p.id,
        duprId: p.duprId,
        matches: totalMatches,
        wins: p.wins,
        losses: p.losses,
        winRate: totalMatches > 0 ? p.wins / totalMatches : 0,
        avgDuprChange: p.duprChanges.length > 0 ? totalChange / p.duprChanges.length : 0,
        totalDuprChange: totalChange,
      };
    })
    .sort((a, b) => b.totalDuprChange - a.totalDuprChange);
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

export function getSummaryStats(
  matches: MatchRecord[],
  currentRating?: number | null,
  ratingHistory?: RatingPoint[]
) {
  // Use rating history for highest/lowest if available
  const historyRatings = (ratingHistory || [])
    .map((r) => r.rating)
    .filter((r) => r != null && !isNaN(r));

  const matchRatings = matches
    .filter((m) => m.doublesRating != null)
    .map((m) => m.doublesRating!);

  const allRatings = historyRatings.length > 0 ? historyRatings : matchRatings;

  const doublesMatches = matches.filter((m) => m.eventFormat === "DOUBLES");
  const singlesMatches = matches.filter((m) => m.eventFormat === "SINGLES");

  const wins = matches.filter((m) => m.won).length;
  const doublesWins = doublesMatches.filter((m) => m.won).length;
  const singlesWins = singlesMatches.filter((m) => m.won).length;

  return {
    currentRating: currentRating ?? (allRatings.length > 0 ? allRatings[allRatings.length - 1] : null),
    highestRating: allRatings.length > 0 ? Math.max(...allRatings) : null,
    lowestRating: allRatings.length > 0 ? Math.min(...allRatings) : null,
    totalMatches: matches.length,
    doublesMatches: doublesMatches.length,
    singlesMatches: singlesMatches.length,
    totalWins: wins,
    totalLosses: matches.length - wins,
    winRate: matches.length > 0 ? wins / matches.length : 0,
    doublesWinRate:
      doublesMatches.length > 0 ? doublesWins / doublesMatches.length : 0,
    singlesWinRate:
      singlesMatches.length > 0 ? singlesWins / singlesMatches.length : 0,
  };
}
