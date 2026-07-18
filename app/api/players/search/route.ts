import { NextRequest, NextResponse } from "next/server";

const MLB_API = "https://statsapi.mlb.com/api/v1";

type Player = {
  id: number;
  fullName: string;
  primaryPosition?: { abbreviation?: string; name?: string };
  currentTeam?: { id: number; name: string };
};

type SearchResponse = { people?: Player[] };

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (name.length < 2) {
    return NextResponse.json({ people: [], error: "Enter at least two characters." }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      names: name,
      sportIds: "1",
      hydrate: "currentTeam",
    });

    const response = await fetch(`${MLB_API}/people/search?${params.toString()}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`MLB player search failed with status ${response.status}`);
    }

    const data = (await response.json()) as SearchResponse;
    const people = (data.people ?? [])
      .filter((player) => Number.isFinite(player.id) && Boolean(player.fullName))
      .slice(0, 30);

    return NextResponse.json({ people });
  } catch (error) {
    console.error("Player search failed", error);
    return NextResponse.json(
      { people: [], error: "Player search is temporarily unavailable." },
      { status: 502 },
    );
  }
}
