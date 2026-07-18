import Link from "next/link";
import {
  getAllMlbTeams,
  getEasternDateString,
  getMlbGames,
  isValidDateString,
  shiftDate,
} from "@/lib/mlb";
import type { MlbGame } from "@/types/mlb";
import styles from "./schedule.module.css";

function logo(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

function easternTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function displayDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    ...options,
  }).format(new Date(`${value}T12:00:00Z`));
}

function hrefFor(date: string, team?: string) {
  const params = new URLSearchParams({ date });
  if (team) params.set("team", team);
  return `/schedule?${params.toString()}`;
}

function broadcastLabel(game: MlbGame) {
  const names = [...new Set((game.broadcasts ?? []).filter((item) => item.type === "TV").map((item) => item.name))];
  return names.length ? names.join(" · ") : "Broadcast TBD";
}

function stateLabel(game: MlbGame) {
  if (game.status.abstractGameState === "Live") {
    const inning = game.linescore?.currentInningOrdinal;
    const half = game.linescore?.inningHalf;
    return inning ? `${half ? `${half} ` : ""}${inning}` : game.status.detailedState;
  }
  if (game.status.abstractGameState === "Final") return game.status.detailedState;
  return easternTime(game.gameDate);
}

function TeamLine({ side, final }: { side: MlbGame["teams"]["away"]; final: boolean }) {
  return (
    <div className={styles.teamLine}>
      <img src={logo(side.team.id)} alt="" width={42} height={42} />
      <div>
        <Link href={`/teams/${side.team.id}`}>{side.team.name}</Link>
        <span>{side.leagueRecord ? `${side.leagueRecord.wins}-${side.leagueRecord.losses}` : "Season record unavailable"}</span>
      </div>
      <strong>{final || side.score !== undefined ? side.score ?? 0 : "—"}</strong>
    </div>
  );
}

function GameCard({ game }: { game: MlbGame }) {
  const live = game.status.abstractGameState === "Live";
  const final = game.status.abstractGameState === "Final";
  const awayPitcher = game.teams.away.probablePitcher?.fullName ?? "TBD";
  const homePitcher = game.teams.home.probablePitcher?.fullName ?? "TBD";

  return (
    <article className={`${styles.gameCard} ${live ? styles.liveCard : ""}`}>
      <header className={styles.gameHeader}>
        <div>
          <span className={`${styles.status} ${live ? styles.liveStatus : final ? styles.finalStatus : styles.previewStatus}`}>
            {stateLabel(game)}
          </span>
          <span className={styles.series}>{game.seriesDescription ?? "MLB"}</span>
        </div>
        <Link className={styles.gameCenterLink} href={`/games/${game.gamePk}`}>Game Center →</Link>
      </header>

      <div className={styles.matchup}>
        <TeamLine side={game.teams.away} final={final || live} />
        <div className={styles.at}>at</div>
        <TeamLine side={game.teams.home} final={final || live} />
      </div>

      <div className={styles.details}>
        <div>
          <span>Probable pitchers</span>
          <strong>{awayPitcher} vs. {homePitcher}</strong>
        </div>
        <div>
          <span>Ballpark</span>
          <strong>{game.venue?.name ?? "Venue TBD"}</strong>
        </div>
        <div>
          <span>Watch</span>
          <strong>{broadcastLabel(game)}</strong>
        </div>
      </div>
    </article>
  );
}

function GameGroup({ title, subtitle, games }: { title: string; subtitle: string; games: MlbGame[] }) {
  if (!games.length) return null;
  return (
    <section className={styles.group}>
      <div className={styles.groupHeading}>
        <div><span className="eyebrow">{subtitle}</span><h2>{title}</h2></div>
        <span>{games.length} {games.length === 1 ? "game" : "games"}</span>
      </div>
      <div className={styles.gameGrid}>{games.map((game) => <GameCard key={game.gamePk} game={game} />)}</div>
    </section>
  );
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const rawDate = typeof query.date === "string" ? query.date : undefined;
  const rawTeam = typeof query.team === "string" ? query.team : undefined;
  const today = getEasternDateString();
  const selectedDate = isValidDateString(rawDate) ? rawDate : today;

  const [gamesResult, teamsResult] = await Promise.allSettled([
    getMlbGames(selectedDate),
    getAllMlbTeams(selectedDate.slice(0, 4)),
  ]);

  const allGames = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const teams = teamsResult.status === "fulfilled" ? teamsResult.value : [];
  const selectedTeam = rawTeam && /^\d+$/.test(rawTeam) ? rawTeam : "";
  const games = selectedTeam
    ? allGames.filter((game) => game.teams.away.team.id === Number(selectedTeam) || game.teams.home.team.id === Number(selectedTeam))
    : allGames;

  const live = games.filter((game) => game.status.abstractGameState === "Live");
  const upcoming = games.filter((game) => game.status.abstractGameState !== "Live" && game.status.abstractGameState !== "Final");
  const finals = games.filter((game) => game.status.abstractGameState === "Final");
  const week = Array.from({ length: 7 }, (_, index) => shiftDate(selectedDate, index - 3));
  const selectedTeamName = teams.find((team) => team.id === Number(selectedTeam))?.name;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className="eyebrow">Daily MLB planner</span>
          <h1>Schedule</h1>
          <p>Browse every matchup, probable pitching assignment, venue, broadcast listing, and live game status.</p>
        </div>
        <div className={styles.heroStat}>
          <strong>{games.length}</strong>
          <span>{selectedTeamName ? `${selectedTeamName} games` : "games scheduled"}</span>
        </div>
      </header>

      <section className={styles.controls} aria-label="Schedule controls">
        <div className={styles.dateNav}>
          <Link href={hrefFor(shiftDate(selectedDate, -1), selectedTeam)}>← Previous</Link>
          <form className={styles.dateForm} method="get">
            <label htmlFor="schedule-date">Choose date</label>
            <input id="schedule-date" name="date" type="date" defaultValue={selectedDate} />
            {selectedTeam ? <input type="hidden" name="team" value={selectedTeam} /> : null}
            <button type="submit">Go</button>
          </form>
          <Link href={hrefFor(shiftDate(selectedDate, 1), selectedTeam)}>Next →</Link>
        </div>

        <div className={styles.weekStrip}>
          {week.map((date) => {
            const active = date === selectedDate;
            const isToday = date === today;
            return (
              <Link key={date} className={active ? styles.activeDay : ""} href={hrefFor(date, selectedTeam)}>
                <span>{isToday ? "Today" : displayDate(date, { weekday: "short" })}</span>
                <strong>{displayDate(date, { month: "short", day: "numeric" })}</strong>
              </Link>
            );
          })}
        </div>

        <form className={styles.teamFilter} method="get">
          <input type="hidden" name="date" value={selectedDate} />
          <label htmlFor="team-filter">Filter by team</label>
          <select id="team-filter" name="team" defaultValue={selectedTeam}>
            <option value="">All MLB teams</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <button type="submit">Apply</button>
          {selectedTeam ? <Link href={hrefFor(selectedDate)}>Clear filter</Link> : null}
        </form>
      </section>

      <div className={styles.dateHeading}>
        <div>
          <span className="eyebrow">{selectedDate === today ? "Today" : displayDate(selectedDate, { weekday: "long" })}</span>
          <h2>{displayDate(selectedDate, { month: "long", day: "numeric", year: "numeric" })}</h2>
        </div>
        <div className={styles.summaryPills}>
          <span>{live.length} live</span>
          <span>{upcoming.length} upcoming</span>
          <span>{finals.length} final</span>
        </div>
      </div>

      {gamesResult.status === "rejected" ? (
        <section className={styles.empty}><h2>Schedule temporarily unavailable</h2><p>The MLB schedule feed could not be loaded. Please try again shortly.</p></section>
      ) : games.length ? (
        <>
          <GameGroup title="Live Now" subtitle="In progress" games={live} />
          <GameGroup title="Upcoming Games" subtitle="On deck" games={upcoming} />
          <GameGroup title="Final Scores" subtitle="Completed" games={finals} />
        </>
      ) : (
        <section className={styles.empty}>
          <h2>{selectedTeamName ? `${selectedTeamName} are off` : "No MLB games scheduled"}</h2>
          <p>Choose another date or clear the team filter to browse the complete MLB schedule.</p>
          <Link href={hrefFor(today)}>Return to today</Link>
        </section>
      )}
    </div>
  );
}