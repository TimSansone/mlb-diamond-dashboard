import type {
  MlbGame,
  MlbScheduleResponse,
  MlbTeam,
  MlbTeamsResponse,
  RosterResponse,
  StandingsResponse,
  StandingsTeamRecord,
  TeamLeadersResponse,
} from "@/types/mlb";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

async function fetchMlb<T>(path: string, revalidate = 300): Promise<T> {
  const response = await fetch(`${MLB_API_BASE}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MLB request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

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

export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isValidDateString(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime());
}

export async function getMlbGames(date: string): Promise<MlbGame[]> {
  const params = new URLSearchParams({
    sportId: "1",
    date,
    hydrate: "team,linescore,probablePitcher",
  });
  const data = await fetchMlb<MlbScheduleResponse>(`/schedule?${params.toString()}`, 30);
  return data.dates?.flatMap((entry) => entry.games) ?? [];
}

export async function getGameFeed(gamePk: string) {
  if (!/^\d+$/.test(gamePk)) throw new Error("Invalid MLB game identifier.");
  const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, {
    next: { revalidate: 15 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`MLB game feed request failed with status ${response.status}.`);
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
  return fetchMlb<StandingsResponse>(`/standings?${params.toString()}`, 300);
}

export async function getAllMlbTeams(season = getCurrentSeason()): Promise<MlbTeam[]> {
  const params = new URLSearchParams({ sportId: "1", season, hydrate: "division,league,venue" });
  const data = await fetchMlb<MlbTeamsResponse>(`/teams?${params.toString()}`, 86400);
  return data.teams.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getMlbTeam(teamId: string, season = getCurrentSeason()): Promise<MlbTeam | null> {
  if (!/^\d+$/.test(teamId)) return null;

  try {
    const params = new URLSearchParams({ season, hydrate: "division,league,venue" });
    const data = await fetchMlb<MlbTeamsResponse>(`/teams/${teamId}?${params.toString()}`, 3600);
    if (data.teams[0]) return data.teams[0];
  } catch {
    // Some Stats API responses intermittently reject the single-team hydrated request.
    // Fall back to the all-team endpoint, which is also used by the working team directory.
  }

  const teams = await getAllMlbTeams(season);
  return teams.find((team) => team.id === Number(teamId)) ?? null;
}

export async function getTeamSchedule(teamId: string, startDate: string, endDate: string): Promise<MlbGame[]> {
  const params = new URLSearchParams({
    sportId: "1",
    teamId,
    startDate,
    endDate,
    hydrate: "team,linescore,probablePitcher",
  });
  const data = await fetchMlb<MlbScheduleResponse>(`/schedule?${params.toString()}`, 60);
  return data.dates?.flatMap((entry) => entry.games) ?? [];
}

export async function getTeamRoster(teamId: string, season = getCurrentSeason()) {
  const params = new URLSearchParams({ rosterType: "active", season });
  const data = await fetchMlb<RosterResponse>(`/teams/${teamId}/roster?${params.toString()}`, 3600);
  return data.roster;
}

export async function getTeamLeaders(teamId: string, season = getCurrentSeason()) {
  const params = new URLSearchParams({
    leaderCategories: "homeRuns,runsBattedIn,battingAverage,wins,strikeouts,earnedRunAverage",
    season,
    leaderGameTypes: "R",
    limit: "3",
  });
  const data = await fetchMlb<TeamLeadersResponse>(`/teams/${teamId}/leaders?${params.toString()}`, 900);
  return data.leagueLeaders;
}

export async function getTeamStanding(teamId: number, season = getCurrentSeason()): Promise<StandingsTeamRecord | null> {
  const standings = await getStandings("regularSeason", season);
  return standings.records.flatMap((record) => record.teamRecords).find((record) => record.team.id === teamId) ?? null;
}
