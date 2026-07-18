import BaseballCentral from "@/components/BaseballCentral";
import DateNavigator from "@/components/DateNavigator";
import GameCard from "@/components/GameCard";
import { getBaseballCentral } from "@/lib/baseball-central";
import { getEasternDateString, getMlbGames, isValidDateString } from "@/lib/mlb";

type HomePageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const today = getEasternDateString();
  const selectedDate = isValidDateString(params.date) ? params.date : today;
  const games = await getMlbGames(selectedDate);
  const central = await getBaseballCentral(games);

  return (
    <section className="scoreboardPage">
      <DateNavigator date={selectedDate} today={today} />

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
            <GameCard key={game.gamePk} game={game} />
          ))}
        </div>
      ) : (
        <div className="emptyState">
          <span className="emptyIcon">⚾</span>
          <h2>No MLB games scheduled</h2>
          <p>Choose another date to view completed or upcoming games.</p>
        </div>
      )}

      <BaseballCentral data={central} selectedDate={selectedDate} isToday={selectedDate === today} />
    </section>
  );
}
