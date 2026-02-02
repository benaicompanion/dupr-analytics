import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { duprFetch } from "@/lib/dupr-api";

export const maxDuration = 30;

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
    const allMembers: unknown[] = [];
    let offset = 0;
    const limit = 20;
    let total = Infinity;

    while (offset < total && allMembers.length < 200) {
      const data = await duprFetch(`/club/${id}/members/v1.0/all`, {
        method: "POST",
        token,
        body: JSON.stringify({
          exclude: [],
          limit,
          offset,
          query: "*",
        }),
      });

      const hits = data?.result?.hits || [];
      total = data?.result?.total || 0;
      allMembers.push(...hits);
      offset += limit;

      if (offset < total) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    // Ignore the query param for search filtering - unused for now
    void req.nextUrl.searchParams;

    return NextResponse.json({
      members: allMembers,
      total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get club members";
    console.error("[Club Members] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
