import BaseballCentral from "@/components/BaseballCentral";
import DateNavigator from "@/components/DateNavigator";
import GameCard from "@/components/GameCard";
import ScoreboardAutoRefresh from "@/components/ScoreboardAutoRefresh";
import { getBaseballCentral } from "@/lib/baseball-central";
import { getLiveGameSituations } from "@/lib/live-situations";
import { getFreshMlbGames } from "@/lib/live-scores";
import { getEasternDateString, getMlbGames, isValidDateString } from "@/lib/mlb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const today = getEasternDateString();
  const selectedDate = isValidDateString(params.date) ? params.date : today;
  const isToday = selectedDate === today;
  const games = isToday ? await getFreshMlbGames(selectedDate) : await getMlbGames(selectedDate);
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
      <ScoreboardAutoRefresh active={isToday} />

      <div className="scoreboardSummary">
        <div>
          <strong>{games.length}</strong>
          <span>{games.length === 1 ? " game" : " games"}</span>
        </div>
        <p>Scores, schedules, probable pitchers, live game status, and daily MLB highlights.</p>
      </div>

      {games.length > 0 ? (
        <div className="gameGrid">
          {games.map((game) => (
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
