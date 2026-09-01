import BaseballCentral from "@/components/BaseballCentral";
import DateNavigator from "@/components/DateNavigator";
import GameCard from "@/components/GameCard";
import LiveAlerts from "@/components/LiveAlerts";
import ScoreboardAutoRefresh from "@/components/ScoreboardAutoRefresh";
import { getBaseballCentral } from "@/lib/baseball-central";
import { getLiveGameSituations } from "@/lib/live-situations";
import { getFreshMlbGames } from "@/lib/live-scores";
import { getEasternDateString, getMlbGames, isValidDateString } from "@/lib/mlb";
import type { MlbGame } from "@/types/mlb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams: Promise<{ date?: string }>;
};

function statusPriority(game: MlbGame) {
  const state = game.status.abstractGameState;
  if (state === "Live") return 0;
  if (state === "Final") return 2;
  return 1;
}

function sortGamesByStatus(games: MlbGame[]): MlbGame[] {
  return games
    .map((game, index) => ({ game, index }))
    .sort((a, b) => statusPriority(a.game) - statusPriority(b.game) || a.index - b.index)
    .map(({ game }) => game);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const today = getEasternDateString();
  const selectedDate = isValidDateString(params.date) ? params.date : today;
  const isToday = selectedDate === today;
  const isFutureDate = selectedDate > today;
  // Fetch uncached data for today and any past date so a game that's still
  // live from a prior calendar day (e.g. a late West Coast start crossing
  // midnight Eastern) keeps getting real-time updates, not just "today".
  const games = isFutureDate ? await getMlbGames(selectedDate) : await getFreshMlbGames(selectedDate);
  const hasUnfinishedGames = games.some((game) => game.status.abstractGameState !== "Final");
  // Keep the refresh controls (and their polling) alive whenever the
  // selected date could still change: it's today, or it's a past date that
  // still has a game in progress.
  const showLiveControls = isToday || (!isFutureDate && hasUnfinishedGames);
  const liveGamePks = games
    .filter((game) => game.status.abstractGameState === "Live")
    .map((game) => game.gamePk);
  const [central, liveSituations] = await Promise.all([
    getBaseballCentral(games),
    getLiveGameSituations(liveGamePks),
  ]);

  return (
    <section className="scoreboardPage">
      <DateNavigator date={selectedDate} today={today} />
      {showLiveControls && (
        <div className="controlsRow">
          <ScoreboardAutoRefresh active={showLiveControls} />
          <LiveAlerts games={games} />
        </div>
      )}

      <div className="scoreboardSummary">
        <div>
          <strong>{games.length}</strong>
          <span>{games.length === 1 ? " game" : " games"}</span>
        </div>
        <p>Scores, schedules, probable pitchers, live game status, and daily MLB highlights.</p>
      </div>

      {games.length > 0 ? (
        <div className="gameGrid">
          {sortGamesByStatus(games).map((game) => (
            <GameCard key={game.gamePk} game={game} situation={liveSituations[game.gamePk]} />
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <span className="emptyIcon">⚾</span>
          <h2>No MLB games scheduled</h2>
          <p>Choose another date to view completed or upcoming games.</p>
        </div>
      )}

      <BaseballCentral data={central} selectedDate={selectedDate} isToday={isToday} />
    </section>
  );
}
