import Link from "next/link";
import { getEasternDateString, isValidDateString, shiftDate } from "@/lib/mlb";
import styles from "./trends.module.css";

const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

type ScheduleGame = {
  gamePk: number;
  gameDate: string;
  status: { abstractGameState: string; detailedState: string };
};

type ScheduleResponse = {
  dates?: Array<{ games: ScheduleGame[] }>;
};

type PlayerLine = {
  person?: { id?: number; fullName?: string };
  stats?: {
    batting?: { homeRuns?: number; rbi?: number; doubles?: number; triples?: number };
    pitching?: { strikeOuts?: number };
  };
};

type BoxscoreTeam = {
  team?: { id?: number; name?: string };
  players?: Record<string, PlayerLine>;
};

type BoxscoreResponse = {
  teams?: { away?: BoxscoreTeam; home?: BoxscoreTeam };
};

type DailyPlayer = {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  value: number;
};

type DailyData = {
  homeRuns: DailyPlayer[];
  rbi: DailyPlayer[];
  doubles: DailyPlayer[];
  triples: DailyPlayer[];
  strikeouts: DailyPlayer[];
  games: number;
  completedGames: number;
};

function playerImage(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}

function teamLogo(id: number) {
  return `https://www.mlbstatic.com/team-logos/${id}.svg`;
}

async function fetchJson<T>(url: string, revalidate = 30): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`MLB request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function addPlayer(
  target: DailyPlayer[],
  line: PlayerLine,
  team: BoxscoreTeam,
  value: number | undefined,
) {
  const playerId = line.person?.id;
  const playerName = line.person?.fullName;
  const teamId = team.team?.id;
  const teamName = team.team?.name;

  if (!value || !playerId || !playerName || !teamId || !teamName) return;

  target.push({ playerId, playerName, teamId, teamName, value });
}

async function getDailyData(date: string): Promise<DailyData> {
  const params = new URLSearchParams({ sportId: "1", date });
  const schedule = await fetchJson<ScheduleResponse>(`${MLB_API_BASE}/schedule?${params.toString()}`);
  const games = schedule.dates?.flatMap((entry) => entry.games) ?? [];

  const boxscores = await Promise.all(
    games.map(async (game) => {
      try {
        return await fetchJson<BoxscoreResponse>(`${MLB_API_BASE}/game/${game.gamePk}/boxscore`, 30);
      } catch {
        return null;
      }
    }),
  );

  const data: DailyData = {
    homeRuns: [],
    rbi: [],
    doubles: [],
    triples: [],
    strikeouts: [],
    games: games.length,
    completedGames: games.filter((game) => game.status.abstractGameState === "Final").length,
  };

  boxscores.forEach((boxscore) => {
    if (!boxscore?.teams) return;

    [boxscore.teams.away, boxscore.teams.home].forEach((team) => {
      if (!team?.players) return;

      Object.values(team.players).forEach((line) => {
        addPlayer(data.homeRuns, line, team, line.stats?.batting?.homeRuns);
        addPlayer(data.rbi, line, team, line.stats?.batting?.rbi);
        addPlayer(data.doubles, line, team, line.stats?.batting?.doubles);
        addPlayer(data.triples, line, team, line.stats?.batting?.triples);
        addPlayer(data.strikeouts, line, team, line.stats?.pitching?.strikeOuts);
      });
    });
  });

  const sort = (players: DailyPlayer[]) => players.sort((a, b) => b.value - a.value || a.playerName.localeCompare(b.playerName));
  sort(data.homeRuns);
  sort(data.rbi);
  sort(data.doubles);
  sort(data.triples);
  sort(data.strikeouts);

  return data;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function total(players: DailyPlayer[]) {
  return players.reduce((sum, player) => sum + player.value, 0);
}

function PlayerList({ title, subtitle, players, valueLabel }: { title: string; subtitle: string; players: DailyPlayer[]; valueLabel: string }) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <span className="eyebrow">Today</span>
          <h2>{title}</h2>
        </div>
        <strong>{total(players)}</strong>
      </header>

      {players.length ? (
        <ol className={styles.playerList}>
          {players.map((player) => (
            <li key={`${title}-${player.playerId}`}>
              <img className={styles.headshot} src={playerImage(player.playerId)} alt="" width={54} height={54} />
              <span className={styles.playerInfo}>
                <strong>{player.playerName}</strong>
                <span><img src={teamLogo(player.teamId)} alt="" width={20} height={20} />{player.teamName}</span>
              </span>
              <span className={styles.statValue}>{player.value}<small>{valueLabel}</small></span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.empty}>{subtitle}</p>
      )}
    </section>
  );
}

function ProductionChart({ data }: { data: DailyData }) {
  const rows = [
    ["Home runs", total(data.homeRuns)],
    ["RBI", total(data.rbi)],
    ["Doubles", total(data.doubles)],
    ["Triples", total(data.triples)],
    ["Pitcher strikeouts", total(data.strikeouts)],
  ] as const;
  const maximum = Math.max(...rows.map(([, value]) => value), 1);

  return (
    <section className={`${styles.card} ${styles.chartCard}`}>
      <header className={styles.cardHeader}>
        <div><span className="eyebrow">Daily snapshot</span><h2>Production Overview</h2></div>
      </header>
      <div className={styles.chart}>
        {rows.map(([label, value]) => (
          <div className={styles.chartRow} key={label}>
            <span>{label}</span>
            <div className={styles.track}><div className={styles.bar} style={{ width: `${Math.max((value / maximum) * 100, value ? 4 : 0)}%` }} /></div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function TrendsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const query = await searchParams;
  const today = getEasternDateString();
  const date = isValidDateString(query.date) ? query.date : today;
  const data = await getDailyData(date);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <span className="eyebrow">MLB daily analytics</span>
          <h1>Stats &amp; Trends</h1>
          <p>{formatDate(date)}</p>
        </div>
        <div className={styles.dateNav}>
          <Link href={`/trends?date=${shiftDate(date, -1)}`}>← Previous</Link>
          <Link className={styles.todayButton} href="/trends">Today</Link>
          <Link href={`/trends?date=${shiftDate(date, 1)}`}>Next →</Link>
        </div>
      </header>

      <section className={styles.summaryGrid}>
        <div><span>Games scheduled</span><strong>{data.games}</strong></div>
        <div><span>Games final</span><strong>{data.completedGames}</strong></div>
        <div><span>Runs driven in</span><strong>{total(data.rbi)}</strong></div>
        <div><span>Pitcher strikeouts</span><strong>{total(data.strikeouts)}</strong></div>
      </section>

      {data.games ? (
        <>
          <ProductionChart data={data} />
          <div className={styles.grid}>
            <PlayerList title="Home Runs" subtitle="No home runs have been recorded for this date." players={data.homeRuns} valueLabel="HR" />
            <PlayerList title="Runs Batted In" subtitle="No RBI have been recorded for this date." players={data.rbi} valueLabel="RBI" />
            <PlayerList title="Doubles" subtitle="No doubles have been recorded for this date." players={data.doubles} valueLabel="2B" />
            <PlayerList title="Triples" subtitle="No triples have been recorded for this date." players={data.triples} valueLabel="3B" />
            <PlayerList title="Pitcher Strikeouts" subtitle="No pitcher strikeouts have been recorded for this date." players={data.strikeouts} valueLabel="K" />
          </div>
        </>
      ) : (
        <section className={styles.noGames}>
          <span>⚾</span>
          <h2>No MLB games scheduled</h2>
          <p>Choose another date to review its daily statistical leaders.</p>
        </section>
      )}
    </div>
  );
}
