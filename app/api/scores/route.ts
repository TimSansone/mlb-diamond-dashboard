import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestedDate = request.nextUrl.searchParams.get("date") ?? "";

  if (!DATE_PATTERN.test(requestedDate)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  const params = new URLSearchParams({
    sportId: "1",
    date: requestedDate,
    hydrate: "team,linescore",
    _: Date.now().toString(),
  });

  try {
    const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?${params.toString()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `MLB scores request failed with status ${response.status}.` },
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
    return NextResponse.json({ error: "Unable to load MLB scores." }, { status: 502 });
  }
}
