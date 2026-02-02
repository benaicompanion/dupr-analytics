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

// ==========================================
// Advanced Analytics
// ==========================================

export interface OpponentStats {
  name: string;
  id: number;
  duprId: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface UpsetStats {
  upsetsPulled: number;
  upsetsSuffered: number;
  totalWithRatings: number;
  upsetsPulledRate: number;
  upsetsSufferedRate: number;
}

export interface TierPerformance {
  tier: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export interface NemesisFavorite {
  nemesis: OpponentStats | null;
  favorite: OpponentStats | null;
}

export interface ClutchStats {
  clutchGames: number;
  clutchWins: number;
  clutchWinRate: number;
  overallGameWinRate: number;
}

export interface VolatilityStats {
  stdDev: number;
  recentStdDev: number; // last 10 matches
  label: "Low" | "Medium" | "High";
  changes: number[];
}

export interface TrajectoryProjection {
  slope: number; // rating change per day
  projections: { days: number; rating: number }[];
  dataPoints: { date: string; rating: number }[];
}

// Linear regression helper
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function getTrajectoryProjection(matches: MatchRecord[]): TrajectoryProjection | null {
  const sorted = matches
    .filter((m) => m.eventFormat === "DOUBLES" && m.doublesRating != null && m.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Use last 20 matches
  const recent = sorted.slice(-20);
  if (recent.length < 5) return null;
  
  const firstDate = new Date(recent[0].date).getTime();
  const points = recent.map((m) => ({
    x: (new Date(m.date).getTime() - firstDate) / (1000 * 60 * 60 * 24), // days since first
    y: m.doublesRating!,
  }));
  
  const { slope, intercept } = linearRegression(points);
  const lastDay = points[points.length - 1].x;
  const lastRating = slope * lastDay + intercept;
  
  return {
    slope,
    projections: [30, 60, 90].map((days) => ({
      days,
      rating: Math.round((lastRating + slope * days) * 100) / 100,
    })),
    dataPoints: recent.map((m) => ({ date: m.date, rating: m.doublesRating! })),
  };
}

export function getVolatilityStats(matches: MatchRecord[]): VolatilityStats | null {
  const changes = matches
    .filter((m) => m.doublesRatingChange != null)
    .map((m) => m.doublesRatingChange!);
  
  if (changes.length < 3) return null;
  
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const variance = changes.reduce((s, c) => s + (c - mean) ** 2, 0) / changes.length;
  const stdDev = Math.sqrt(variance);
  
  const recentChanges = changes.slice(-10);
  const recentMean = recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length;
  const recentVariance = recentChanges.reduce((s, c) => s + (c - recentMean) ** 2, 0) / recentChanges.length;
  const recentStdDev = Math.sqrt(recentVariance);
  
  let label: "Low" | "Medium" | "High" = "Low";
  if (stdDev > 0.03) label = "Medium";
  if (stdDev > 0.06) label = "High";
  
  return { stdDev, recentStdDev, label, changes };
}

export function getOpponentStats(matches: MatchRecord[]): OpponentStats[] {
  const opponentMap = new Map<number, { name: string; id: number; duprId: string; wins: number; losses: number }>();
  
  for (const match of matches) {
    for (const opp of match.opponents) {
      if (!opp.id) continue;
      if (!opponentMap.has(opp.id)) {
        opponentMap.set(opp.id, { name: opp.name, id: opp.id, duprId: opp.duprId, wins: 0, losses: 0 });
      }
      const entry = opponentMap.get(opp.id)!;
      if (match.won) entry.wins++;
      else entry.losses++;
    }
  }
  
  return Array.from(opponentMap.values())
    .map((o) => ({
      ...o,
      matches: o.wins + o.losses,
      winRate: (o.wins + o.losses) > 0 ? o.wins / (o.wins + o.losses) : 0,
    }))
    .sort((a, b) => b.matches - a.matches);
}

export function getUpsetStats(matches: MatchRecord[], rawMatches: any[], userId: number): UpsetStats {
  let upsetsPulled = 0;
  let upsetsSuffered = 0;
  let totalWithRatings = 0;
  
  for (const raw of rawMatches) {
    const teams = raw.teams || [];
    const found = findUserInTeams(teams, userId);
    if (!found) continue;
    
    const { userTeam, opponentTeam } = found;
    if (!userTeam || !opponentTeam) continue;
    
    const userImpact = userTeam.preMatchRatingAndImpact || {};
    const oppImpact = opponentTeam.preMatchRatingAndImpact || {};
    
    // Get pre-match ratings for both teams
    const userR1 = userImpact.preMatchDoubleRatingPlayer1;
    const userR2 = userImpact.preMatchDoubleRatingPlayer2;
    const oppR1 = oppImpact.preMatchDoubleRatingPlayer1;
    const oppR2 = oppImpact.preMatchDoubleRatingPlayer2;
    
    const userRatings = [userR1, userR2].filter((r) => r != null && r > 0);
    const oppRatings = [oppR1, oppR2].filter((r) => r != null && r > 0);
    
    if (userRatings.length === 0 || oppRatings.length === 0) continue;
    
    const userAvg = userRatings.reduce((a: number, b: number) => a + b, 0) / userRatings.length;
    const oppAvg = oppRatings.reduce((a: number, b: number) => a + b, 0) / oppRatings.length;
    
    totalWithRatings++;
    const userWon = userTeam.winner === true;
    const ratingDiff = userAvg - oppAvg;
    
    if (userWon && ratingDiff < -0.05) {
      // Won as underdog
      upsetsPulled++;
    } else if (!userWon && ratingDiff > 0.05) {
      // Lost as favorite
      upsetsSuffered++;
    }
  }
  
  return {
    upsetsPulled,
    upsetsSuffered,
    totalWithRatings,
    upsetsPulledRate: totalWithRatings > 0 ? upsetsPulled / totalWithRatings : 0,
    upsetsSufferedRate: totalWithRatings > 0 ? upsetsSuffered / totalWithRatings : 0,
  };
}

export function getTierPerformance(matches: MatchRecord[], rawMatches: any[], userId: number): TierPerformance[] {
  const tiers: Record<string, { wins: number; losses: number }> = {
    "< 3.0": { wins: 0, losses: 0 },
    "3.0 - 3.5": { wins: 0, losses: 0 },
    "3.5 - 4.0": { wins: 0, losses: 0 },
    "4.0 - 4.5": { wins: 0, losses: 0 },
    "4.5+": { wins: 0, losses: 0 },
  };
  
  for (const raw of rawMatches) {
    const teams = raw.teams || [];
    const found = findUserInTeams(teams, userId);
    if (!found) continue;
    
    const { userTeam, opponentTeam } = found;
    if (!opponentTeam) continue;
    
    const oppImpact = opponentTeam.preMatchRatingAndImpact || {};
    const oppR1 = oppImpact.preMatchDoubleRatingPlayer1;
    const oppR2 = oppImpact.preMatchDoubleRatingPlayer2;
    const oppRatings = [oppR1, oppR2].filter((r: number) => r != null && r > 0);
    if (oppRatings.length === 0) continue;
    
    const oppAvg = oppRatings.reduce((a: number, b: number) => a + b, 0) / oppRatings.length;
    const userWon = userTeam.winner === true;
    
    let tier: string;
    if (oppAvg < 3.0) tier = "< 3.0";
    else if (oppAvg < 3.5) tier = "3.0 - 3.5";
    else if (oppAvg < 4.0) tier = "3.5 - 4.0";
    else if (oppAvg < 4.5) tier = "4.0 - 4.5";
    else tier = "4.5+";
    
    if (userWon) tiers[tier].wins++;
    else tiers[tier].losses++;
  }
  
  return Object.entries(tiers).map(([tier, { wins, losses }]) => ({
    tier,
    wins,
    losses,
    total: wins + losses,
    winRate: (wins + losses) > 0 ? wins / (wins + losses) : 0,
  }));
}

export function getNemesisFavorite(opponents: OpponentStats[]): NemesisFavorite {
  const qualified = opponents.filter((o) => o.matches >= 2);
  if (qualified.length === 0) return { nemesis: null, favorite: null };
  
  const nemesis = qualified.reduce((worst, o) => (o.winRate < worst.winRate ? o : worst), qualified[0]);
  const favorite = qualified.reduce((best, o) => (o.winRate > best.winRate ? o : best), qualified[0]);
  
  return {
    nemesis: nemesis.winRate < 0.5 ? nemesis : null,
    favorite: favorite.winRate > 0.5 ? favorite : null,
  };
}

export function getClutchStats(rawMatches: any[], userId: number): ClutchStats {
  let clutchGames = 0;
  let clutchWins = 0;
  let totalGames = 0;
  let totalGameWins = 0;
  
  for (const raw of rawMatches) {
    const teams = raw.teams || [];
    const found = findUserInTeams(teams, userId);
    if (!found) continue;
    
    const { userTeam, opponentTeam } = found;
    if (!opponentTeam) continue;
    
    for (const gameKey of ["game1", "game2", "game3", "game4", "game5"]) {
      const userScore = userTeam[gameKey];
      const oppScore = opponentTeam[gameKey];
      if (userScore == null || oppScore == null || userScore < 0 || oppScore < 0) continue;
      
      totalGames++;
      const diff = Math.abs(userScore - oppScore);
      const userWonGame = userScore > oppScore;
      
      if (userWonGame) totalGameWins++;
      
      if (diff <= 3) {
        clutchGames++;
        if (userWonGame) clutchWins++;
      }
    }
  }
  
  return {
    clutchGames,
    clutchWins,
    clutchWinRate: clutchGames > 0 ? clutchWins / clutchGames : 0,
    overallGameWinRate: totalGames > 0 ? totalGameWins / totalGames : 0,
  };
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
