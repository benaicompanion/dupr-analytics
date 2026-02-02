const DUPR_API_BASE = "https://api.dupr.gg";

export async function duprFetch(
  path: string,
  options: RequestInit & { token?: string } = {}
) {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${DUPR_API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DUPR API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function login(email: string, password: string) {
  const data = await duprFetch("/auth/v1.0/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function getProfile(token: string) {
  return duprFetch("/user/v1.0/profile/", { token });
}

export async function getPlayer(token: string, playerId: number) {
  return duprFetch(`/player/v1.0/${playerId}`, { token });
}

export async function getPlayerStats(token: string, playerId: number) {
  return duprFetch(`/player/v1.0/stats/${playerId}`, { token });
}

export async function getMatchHistory(
  token: string,
  playerId: number,
  offset = 0,
  limit = 100
) {
  return duprFetch(`/player/v1.0/${playerId}/history`, {
    method: "POST",
    token,
    body: JSON.stringify({
      filters: {},
      sort: { order: "DESC", parameter: "MATCH_DATE" },
      limit,
      offset,
    }),
  });
}

export async function getAllMatchHistory(token: string, playerId: number) {
  const allHits: unknown[] = [];
  let offset = 0;
  const limit = 100;
  let total = Infinity;

  while (offset < total) {
    const data = await getMatchHistory(token, playerId, offset, limit);
    const hits = data?.result?.hits || [];
    total = data?.result?.total || 0;
    allHits.push(...hits);
    offset += limit;

    // Rate limiting - small delay between requests
    if (offset < total) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return allHits;
}

export async function getRatingHistory(
  token: string,
  playerId: number,
  type: "SINGLES" | "DOUBLES" = "DOUBLES"
) {
  return duprFetch(`/player/v1.0/${playerId}/rating-history`, {
    method: "POST",
    token,
    body: JSON.stringify({
      type,
      limit: 500,
      offset: 0,
      sortBy: "asc",
    }),
  });
}

export async function searchPlayers(token: string, query: string) {
  return duprFetch("/player/v1.0/search", {
    method: "POST",
    token,
    body: JSON.stringify({
      limit: 25,
      offset: 0,
      query,
      filter: {
        lat: 39.7392,
        lng: -104.9903,
        radiusInMeters: 1000000,
      },
      includeUnclaimedPlayers: false,
    }),
  });
}
