import { NextRequest, NextResponse } from "next/server";

const GAME_PK_PATTERN = /^\d+$/;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ gamePk: string }> }) {
  const { gamePk } = await params;

  if (!GAME_PK_PATTERN.test(gamePk)) {
    return NextResponse.json({ error: "A valid game identifier is required." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?_=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `MLB game feed request failed with status ${response.status}.` },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load live game data." }, { status: 502 });
  }
}
