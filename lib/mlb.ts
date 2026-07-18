import type {
  MlbGame,
  MlbScheduleResponse,
  StandingsResponse,
} from "@/types/mlb";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

export function getEasternDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getCurrentSeason(): string {
  return getEasternDateString().slice(0, 4);
}

export function isValidDateString(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}

export async function getMlbGames(date: string): Promise<MlbGame[]> {
  const params = new URLSearchParams({
    sportId: "1",
    date,
    hydrate: "team,linescore,probablePitcher",
  });

  const response = await fetch(`${MLB_API_BASE}/schedule?${params.toString()}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MLB schedule request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as MlbScheduleResponse;
  return data.dates?.flatMap((entry) => entry.games) ?? [];
}

export async function getGameFeed(gamePk: string) {
  if (!/^\d+$/.test(gamePk)) {
    throw new Error("Invalid MLB game identifier.");
  }

  const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, {
    next: { revalidate: 15 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MLB game feed request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function getStandings(
  standingsType: "regularSeason" | "wildCard",
  season = getCurrentSeason(),
): Promise<StandingsResponse> {
  const params = new URLSearchParams({
    leagueId: "103,104",
    season,
    standingsTypes: standingsType,
    hydrate: "team",
  });

  const response = await fetch(`${MLB_API_BASE}/standings?${params.toString()}`, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MLB standings request failed with status ${response.status}.`);
  }

  return (await response.json()) as StandingsResponse;
}