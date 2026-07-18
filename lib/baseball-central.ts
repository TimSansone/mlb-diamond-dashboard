import type { MlbGame } from "@/types/mlb";
import { getGameFeed } from "@/lib/mlb";

type Person = { id?: number; fullName?: string };
type Team = { id?: number; name?: string; abbreviation?: string };
type PlayEvent = {
  details?: {
    isPitch?: boolean;
    description?: string;
    call?: { description?: string };
    type?: { description?: string };
  };
  pitchData?: { startSpeed?: number };
  hitData?: { launchSpeed?: number; totalDistance?: number; launchAngle?: number };
};
type Play = {
  result?: {
    event?: string;
    description?: string;
    awayScore?: number;
    homeScore?: number;
    rbi?: number;
  };
  about?: { inning?: number; halfInning?: string; isScoringPlay?: boolean };
  matchup?: { batter?: Person; pitcher?: Person };
  playEvents?: PlayEvent[];
};
type PlayerBox = {
  person?: Person;
  stats?: { pitching?: { strikeOuts?: number; inningsPitched?: string } };
};
type TeamBox = { team?: Team; players?: Record<string, PlayerBox> };
type Feed = {
  gameData?: {
    status?: { abstractGameState?: string; detailedState?: string };
    teams?: { away?: Team; home?: Team };
  };
  liveData?: {
    plays?: { allPlays?: Play[] };
    linescore?: { currentInning?: number; teams?: { away?: { runs?: number }; home?: { runs?: number } } };
    boxscore?: { teams?: { away?: TeamBox; home?: TeamBox } };
  };
};

export type DailyPlayerLeader = {
  playerId?: number;
  name: string;
  team?: string;
  value: number;
  detail?: string;
};

export type DailyHighlight = {
  title: string;
  value: string;
  detail: string;
  playerId?: number;
  gamePk?: number;
};

export type BaseballCentralData = {
  homeRunLeaders: DailyPlayerLeader[];
  strikeoutLeaders: DailyPlayerLeader[];
  longestHomeRun?: DailyHighlight;
  hardestHit?: DailyHighlight;
  fastestPitch?: DailyHighlight;
  biggestComeback?: DailyHighlight;
  mostExcitingGame?: DailyHighlight;
  feedsLoaded: number;
};

const teamLabel = (team?: Team) => team?.abbreviation ?? team?.name ?? "";

function playerTeam(playerId: number | undefined, feed: Feed) {
  if (!playerId) return "";
  const away = feed.liveData?.boxscore?.teams?.away;
  const home = feed.liveData?.boxscore?.teams?.home;
  if (away?.players?.[`ID${playerId}`]) return teamLabel(away.team ?? feed.gameData?.teams?.away);
  if (home?.players?.[`ID${playerId}`]) return teamLabel(home.team ?? feed.gameData?.teams?.home);
  return "";
}

function addLeader(map: Map<number | string, DailyPlayerLeader>, player: Person | undefined, team: string, amount = 1, detail?: string) {
  const key = player?.id ?? player?.fullName ?? `unknown-${map.size}`;
  const existing = map.get(key);
  map.set(key, {
    playerId: player?.id,
    name: player?.fullName ?? "Unknown player",
    team,
    value: (existing?.value ?? 0) + amount,
    detail: detail ?? existing?.detail,
  });
}

function sortedLeaders(map: Map<number | string, DailyPlayerLeader>, limit = 5) {
  return [...map.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, limit);
}

function comebackAndExcitement(game: MlbGame, feed: Feed) {
  const plays = feed.liveData?.plays?.allPlays ?? [];
  const awayName = feed.gameData?.teams?.away?.name ?? game.teams.away.team.name;
  const homeName = feed.gameData?.teams?.home?.name ?? game.teams.home.team.name;
  const finalAway = feed.liveData?.linescore?.teams?.away?.runs ?? game.teams.away.score ?? 0;
  const finalHome = feed.liveData?.linescore?.teams?.home?.runs ?? game.teams.home.score ?? 0;
  const winner = finalAway === finalHome ? undefined : finalAway > finalHome ? "away" : "home";

  let maxWinnerDeficit = 0;
  let previousLeader = 0;
  let leadChanges = 0;
  let scoringEvents = 0;

  for (const play of plays) {
    if (play.result?.awayScore === undefined || play.result?.homeScore === undefined) continue;
    const away = play.result.awayScore;
    const home = play.result.homeScore;
    if (play.about?.isScoringPlay) scoringEvents += 1;
    if (winner === "away") maxWinnerDeficit = Math.max(maxWinnerDeficit, home - away);
    if (winner === "home") maxWinnerDeficit = Math.max(maxWinnerDeficit, away - home);
    const leader = away === home ? 0 : away > home ? 1 : -1;
    if (leader && previousLeader && leader !== previousLeader) leadChanges += 1;
    if (leader) previousLeader = leader;
  }

  const margin = Math.abs(finalAway - finalHome);
  const inning = feed.liveData?.linescore?.currentInning ?? 9;
  const extras = Math.max(0, inning - 9);
  const live = feed.gameData?.status?.abstractGameState === "Live";
  const excitement = leadChanges * 5 + scoringEvents + Math.max(0, 5 - margin) * 2 + extras * 4 + (live && margin <= 2 ? 6 : 0);

  return {
    comeback: maxWinnerDeficit > 0 && winner ? {
      title: "Biggest comeback",
      value: `${maxWinnerDeficit}-run rally`,
      detail: `${winner === "away" ? awayName : homeName} erased a ${maxWinnerDeficit}-run deficit`,
      gamePk: game.gamePk,
    } satisfies DailyHighlight : undefined,
    excitement: {
      title: "Most exciting game",
      value: `${awayName} ${finalAway}, ${homeName} ${finalHome}`,
      detail: `${leadChanges} lead change${leadChanges === 1 ? "" : "s"} · ${scoringEvents} scoring plays${extras ? ` · ${extras} extra inning${extras === 1 ? "" : "s"}` : ""}`,
      gamePk: game.gamePk,
      score: excitement,
    },
  };
}

export async function getBaseballCentral(games: MlbGame[]): Promise<BaseballCentralData> {
  const settled = await Promise.allSettled(games.map(async (game) => ({ game, feed: await getGameFeed(String(game.gamePk)) as Feed })));
  const entries = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  const homeRuns = new Map<number | string, DailyPlayerLeader>();
  const strikeouts = new Map<number | string, DailyPlayerLeader>();
  let longestHomeRun: DailyHighlight | undefined;
  let hardestHit: DailyHighlight | undefined;
  let fastestPitch: DailyHighlight | undefined;
  let biggestComeback: DailyHighlight | undefined;
  let excitingCandidate: (DailyHighlight & { score: number }) | undefined;

  for (const { game, feed } of entries) {
    const plays = feed.liveData?.plays?.allPlays ?? [];
    for (const play of plays) {
      const batterTeam = playerTeam(play.matchup?.batter?.id, feed);
      if ((play.result?.event ?? "").toLowerCase() === "home run") {
        addLeader(homeRuns, play.matchup?.batter, batterTeam, 1, play.result?.description);
      }

      for (const event of play.playEvents ?? []) {
        const distance = event.hitData?.totalDistance;
        if (distance && (!longestHomeRun || distance > Number.parseFloat(longestHomeRun.value))) {
          longestHomeRun = {
            title: "Longest home run",
            value: `${Math.round(distance)} ft`,
            detail: `${play.matchup?.batter?.fullName ?? "Unknown hitter"}${event.hitData?.launchAngle !== undefined ? ` · ${Math.round(event.hitData.launchAngle)}° launch angle` : ""}`,
            playerId: play.matchup?.batter?.id,
            gamePk: game.gamePk,
          };
        }
        const exitVelocity = event.hitData?.launchSpeed;
        if (exitVelocity && (!hardestHit || exitVelocity > Number.parseFloat(hardestHit.value))) {
          hardestHit = {
            title: "Hardest-hit ball",
            value: `${exitVelocity.toFixed(1)} mph`,
            detail: `${play.matchup?.batter?.fullName ?? "Unknown hitter"} · ${play.result?.event ?? "Ball in play"}`,
            playerId: play.matchup?.batter?.id,
            gamePk: game.gamePk,
          };
        }
        const velocity = event.pitchData?.startSpeed;
        if (velocity && (!fastestPitch || velocity > Number.parseFloat(fastestPitch.value))) {
          fastestPitch = {
            title: "Fastest pitch",
            value: `${velocity.toFixed(1)} mph`,
            detail: `${play.matchup?.pitcher?.fullName ?? "Unknown pitcher"} · ${event.details?.type?.description ?? "Pitch"}`,
            playerId: play.matchup?.pitcher?.id,
            gamePk: game.gamePk,
          };
        }
      }
    }

    const boxes = [feed.liveData?.boxscore?.teams?.away, feed.liveData?.boxscore?.teams?.home];
    for (const box of boxes) {
      for (const player of Object.values(box?.players ?? {})) {
        const total = player.stats?.pitching?.strikeOuts ?? 0;
        if (total > 0) addLeader(strikeouts, player.person, teamLabel(box?.team), total, `${player.stats?.pitching?.inningsPitched ?? "0.0"} IP`);
      }
    }

    const metrics = comebackAndExcitement(game, feed);
    if (metrics.comeback) {
      const runs = Number.parseInt(metrics.comeback.value, 10);
      if (!biggestComeback || runs > Number.parseInt(biggestComeback.value, 10)) biggestComeback = metrics.comeback;
    }
    if (!excitingCandidate || metrics.excitement.score > excitingCandidate.score) excitingCandidate = metrics.excitement;
  }

  const mostExcitingGame = excitingCandidate ? (({ score: _score, ...highlight }) => highlight)(excitingCandidate) : undefined;

  return {
    homeRunLeaders: sortedLeaders(homeRuns),
    strikeoutLeaders: sortedLeaders(strikeouts),
    longestHomeRun,
    hardestHit,
    fastestPitch,
    biggestComeback,
    mostExcitingGame,
    feedsLoaded: entries.length,
  };
}
