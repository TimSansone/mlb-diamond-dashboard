export type PitchBadge = {
  code: string;
  label: string;
  kind: "ball" | "strike" | "foul" | "inplay" | "other";
};

export type PlayerGameLine = {
  hits: number;
  atBats: number;
  rbi: number;
};

export type PitcherGameLine = {
  pitches: number;
  balls: number;
  strikes: number;
  inningsPitched: string;
  era: string;
};

export type LiveGameSituation = {
  balls: number;
  strikes: number;
  outs: number;
  firstOccupied: boolean;
  secondOccupied: boolean;
  thirdOccupied: boolean;
  batter: string;
  batterId?: number;
  batterLine?: PlayerGameLine;
  pitcher: string;
  pitcherId?: number;
  pitcherLine?: PitcherGameLine;
  lastPitch?: string;
  latestPlay?: string;
  pitchSequence: PitchBadge[];
};

type Person = { id?: number; fullName?: string };
type PlayEvent = {
  details?: {
    isPitch?: boolean;
    description?: string;
    call?: { description?: string; code?: string };
    type?: { description?: string; code?: string };
  };
  pitchData?: { startSpeed?: number };
};
export type Play = {
  result?: { description?: string; event?: string; awayScore?: number; homeScore?: number; rbi?: number };
  about?: { inning?: number; halfInning?: string; isScoringPlay?: boolean; isComplete?: boolean };
  count?: { balls?: number; strikes?: number; outs?: number };
  matchup?: { batter?: Person; pitcher?: Person };
  playEvents?: PlayEvent[];
};
type InningLine = {
  num: number;
  away?: { runs?: number; hits?: number; errors?: number };
  home?: { runs?: number; hits?: number; errors?: number };
};
type Decisions = { winner?: Person; loser?: Person; save?: Person };

export type BattingStats = {
  atBats?: number;
  runs?: number;
  hits?: number;
  rbi?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  homeRuns?: number;
  doubles?: number;
  triples?: number;
  avg?: string;
};

export type PitchingStats = {
  inningsPitched?: string;
  hits?: number;
  runs?: number;
  earnedRuns?: number;
  baseOnBalls?: number;
  strikeOuts?: number;
  homeRuns?: number;
  numberOfPitches?: number;
  strikes?: number;
  era?: string;
};

export type BoxscorePerson = {
  person?: Person;
  jerseyNumber?: string;
  position?: { abbreviation?: string; name?: string };
  battingOrder?: string;
  stats?: { batting?: BattingStats; pitching?: PitchingStats };
  seasonStats?: { batting?: BattingStats; pitching?: PitchingStats };
};

export type TeamBoxscore = {
  battingOrder?: number[];
  batters?: number[];
  pitchers?: number[];
  players?: Record<string, BoxscorePerson>;
};

export type LiveFeed = {
  liveData?: {
    linescore?: {
      balls?: number;
      strikes?: number;
      outs?: number;
      offense?: { first?: Person; second?: Person; third?: Person };
      defense?: { pitcher?: Person };
      innings?: InningLine[];
      teams?: {
        away?: { runs?: number; hits?: number; errors?: number };
        home?: { runs?: number; hits?: number; errors?: number };
      };
    };
    plays?: {
      currentPlay?: Play;
      allPlays?: Play[];
    };
    decisions?: Decisions;
    boxscore?: {
      teams?: { away?: TeamBoxscore; home?: TeamBoxscore };
    };
  };
};

function lastPitchLabel(events?: PlayEvent[]) {
  const pitch = [...(events ?? [])].reverse().find((event) => event.details?.isPitch || event.pitchData);
  if (!pitch) return undefined;
  const parts = [
    pitch.pitchData?.startSpeed ? `${pitch.pitchData.startSpeed.toFixed(1)} mph` : "",
    pitch.details?.type?.description ?? "",
    pitch.details?.call?.description ?? pitch.details?.description ?? "",
  ].filter(Boolean);
  return parts.join(" · ") || undefined;
}

function classifyPitch(event: PlayEvent): PitchBadge {
  const label = event.details?.call?.description ?? event.details?.description ?? "Pitch";
  const lower = label.toLowerCase();

  if (lower.includes("in play")) return { code: "X", label, kind: "inplay" };
  if (lower.includes("foul")) return { code: "F", label, kind: "foul" };
  if (lower.includes("swinging strike") || lower.includes("missed bunt") || lower.includes("called strike")) {
    return { code: "S", label, kind: "strike" };
  }
  if (lower.includes("hit by pitch")) return { code: "HBP", label, kind: "other" };
  if (lower.includes("ball") || lower.includes("pitchout")) return { code: "B", label, kind: "ball" };
  return { code: "•", label, kind: "other" };
}

function pitchSequenceFor(play?: Play): PitchBadge[] {
  const events = (play?.playEvents ?? []).filter((event) => event.details?.isPitch || Boolean(event.pitchData));
  return events.map(classifyPitch);
}

function findPlayer(id: number | undefined, away?: TeamBoxscore, home?: TeamBoxscore): BoxscorePerson | undefined {
  if (!id) return undefined;
  return away?.players?.[`ID${id}`] ?? home?.players?.[`ID${id}`];
}

function batterLineFor(id: number | undefined, away?: TeamBoxscore, home?: TeamBoxscore): PlayerGameLine | undefined {
  const stats = findPlayer(id, away, home)?.stats?.batting;
  if (!stats) return undefined;
  return { hits: stats.hits ?? 0, atBats: stats.atBats ?? 0, rbi: stats.rbi ?? 0 };
}

function pitcherLineFor(id: number | undefined, away?: TeamBoxscore, home?: TeamBoxscore): PitcherGameLine | undefined {
  const player = findPlayer(id, away, home);
  const stats = player?.stats?.pitching;
  if (!stats) return undefined;
  const pitches = stats.numberOfPitches ?? 0;
  const strikes = stats.strikes ?? 0;
  return {
    pitches,
    strikes,
    balls: Math.max(0, pitches - strikes),
    inningsPitched: stats.inningsPitched ?? "0.0",
    era: player?.seasonStats?.pitching?.era ?? stats.era ?? "—",
  };
}

function latestPlayFor(allPlays?: Play[]): string | undefined {
  const play = [...(allPlays ?? [])].reverse().find(
    (item) => item.about?.isComplete !== false && Boolean(item.result?.description || item.result?.event),
  );
  return play?.result?.description ?? play?.result?.event;
}

export function parseLiveSituation(feed: LiveFeed): LiveGameSituation {
  const line = feed.liveData?.linescore;
  const play = feed.liveData?.plays?.currentPlay;
  const away = feed.liveData?.boxscore?.teams?.away;
  const home = feed.liveData?.boxscore?.teams?.home;
  const batter = play?.matchup?.batter;
  const pitcher = play?.matchup?.pitcher ?? line?.defense?.pitcher;

  return {
    balls: line?.balls ?? play?.count?.balls ?? 0,
    strikes: line?.strikes ?? play?.count?.strikes ?? 0,
    outs: line?.outs ?? play?.count?.outs ?? 0,
    firstOccupied: Boolean(line?.offense?.first),
    secondOccupied: Boolean(line?.offense?.second),
    thirdOccupied: Boolean(line?.offense?.third),
    batter: batter?.fullName ?? "TBD",
    batterId: batter?.id,
    batterLine: batterLineFor(batter?.id, away, home),
    pitcher: pitcher?.fullName ?? "TBD",
    pitcherId: pitcher?.id,
    pitcherLine: pitcherLineFor(pitcher?.id, away, home),
    lastPitch: lastPitchLabel(play?.playEvents),
    latestPlay: latestPlayFor(feed.liveData?.plays?.allPlays),
    pitchSequence: pitchSequenceFor(play),
  };
}

async function getLiveSituation(gamePk: number): Promise<LiveGameSituation | null> {
  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live?_=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );

    if (!response.ok) return null;
    const feed = await response.json() as LiveFeed;
    return parseLiveSituation(feed);
  } catch {
    return null;
  }
}

export async function getLiveGameSituations(gamePks: number[]) {
  const entries = await Promise.all(
    gamePks.map(async (gamePk) => [gamePk, await getLiveSituation(gamePk)] as const),
  );

  return Object.fromEntries(entries) as Record<number, LiveGameSituation | null>;
}
