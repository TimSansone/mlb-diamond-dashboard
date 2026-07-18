export type LiveGameSituation = {
  balls: number;
  strikes: number;
  outs: number;
  firstOccupied: boolean;
  secondOccupied: boolean;
  thirdOccupied: boolean;
  batter: string;
  pitcher: string;
};

type Person = { fullName?: string };
type LiveFeed = {
  liveData?: {
    linescore?: {
      balls?: number;
      strikes?: number;
      outs?: number;
      offense?: { first?: Person; second?: Person; third?: Person };
      defense?: { pitcher?: Person };
    };
    plays?: {
      currentPlay?: {
        count?: { balls?: number; strikes?: number; outs?: number };
        matchup?: { batter?: Person; pitcher?: Person };
      };
    };
  };
};

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
    const line = feed.liveData?.linescore;
    const play = feed.liveData?.plays?.currentPlay;

    return {
      balls: line?.balls ?? play?.count?.balls ?? 0,
      strikes: line?.strikes ?? play?.count?.strikes ?? 0,
      outs: line?.outs ?? play?.count?.outs ?? 0,
      firstOccupied: Boolean(line?.offense?.first),
      secondOccupied: Boolean(line?.offense?.second),
      thirdOccupied: Boolean(line?.offense?.third),
      batter: play?.matchup?.batter?.fullName ?? "TBD",
      pitcher: play?.matchup?.pitcher?.fullName ?? line?.defense?.pitcher?.fullName ?? "TBD",
    };
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
