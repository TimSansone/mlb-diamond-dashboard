import type { MlbGame, MlbScheduleResponse } from "@/types/mlb";

const MLB_SCHEDULE_URL = "https://statsapi.mlb.com/api/v1/schedule";

export async function getFreshMlbGames(date: string): Promise<MlbGame[]> {
  const params = new URLSearchParams({
    sportId: "1",
    date,
    hydrate: "team,linescore,probablePitcher,broadcasts(all),venue",
    _: Date.now().toString(),
  });

  const response = await fetch(`${MLB_SCHEDULE_URL}?${params.toString()}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  if (!response.ok) {
    throw new Error(`Fresh MLB schedule request failed with status ${response.status}.`);
  }

  const data = await response.json() as MlbScheduleResponse;
  return data.dates?.flatMap((entry) => entry.games) ?? [];
}
