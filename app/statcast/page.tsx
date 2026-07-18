import Link from "next/link";
import styles from "./statcast.module.css";

const CURRENT_SEASON = new Date().getFullYear();
const SAVANT_URL = "https://baseballsavant.mlb.com/leaderboard/statcast";

type CsvRow = Record<string, string>;

type StatcastPlayer = {
  id: number;
  name: string;
  team: string;
  bbe: number;
  launchAngle: number | null;
  sweetSpot: number | null;
  maxExitVelocity: number | null;
  avgExitVelocity: number | null;
  hardHitRate: number | null;
  barrels: number | null;
  barrelRate: number | null;
};

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers = [], ...values] = rows;
  return values.map((valuesRow) =>
    Object.fromEntries(headers.map((header, index) => [header.trim(), valuesRow[index]?.trim() ?? ""])),
  );
}

function first(row: CsvRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== "") return row[key];
  }
  return "";
}

function numberValue(row: CsvRow, keys: string[]) {
  const value = Number(first(row, keys).replace("%", ""));
  return Number.isFinite(value) ? value : null;
}

function normalizePlayer(row: CsvRow): StatcastPlayer | null {
  const id = Number(first(row, ["player_id", "id"]));
  const listedName = first(row, ["player_name", "name"]);
  const firstName = first(row, ["first_name"]);
  const lastName = first(row, ["last_name"]);
  const name = listedName || [firstName, lastName].filter(Boolean).join(" ");

  if (!Number.isFinite(id) || !name) return null;

  return {
    id,
    name,
    team: first(row, ["team_name", "team", "team_abbrev"]) || "MLB",
    bbe: numberValue(row, ["attempts", "batted_ball_events", "bbe"]) ?? 0,
    launchAngle: numberValue(row, ["avg_hit_angle", "launch_angle_avg"]),
    sweetSpot: numberValue(row, ["anglesweetspotpercent", "sweet_spot_percent"]),
    maxExitVelocity: numberValue(row, ["max_hit_speed", "exit_velocity_max"]),
    avgExitVelocity: numberValue(row, ["avg_hit_speed", "exit_velocity_avg"]),
    hardHitRate: numberValue(row, ["ev95percent", "hard_hit_percent", "hard_hit_rate"]),
    barrels: numberValue(row, ["barrels"]),
    barrelRate: numberValue(row, ["brl_percent", "barrel_batted_rate", "barrel_percent"]),
  };
}

async function getStatcast(type: "batter" | "pitcher") {
  const params = new URLSearchParams({
    type,
    year: String(CURRENT_SEASON),
    position: "",
    team: "",
    min: "q",
    sort: "exit_velocity_avg",
    sortDir: type === "batter" ? "desc" : "asc",
    csv: "true",
  });

  const response = await fetch(`${SAVANT_URL}?${params.toString()}`, {
    next: { revalidate: 1800 },
    headers: { Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8" },
  });

  if (!response.ok) throw new Error(`Statcast request failed with status ${response.status}`);

  return parseCsv(await response.text())
    .map(normalizePlayer)
    .filter((player): player is StatcastPlayer => Boolean(player));
}

function headshot(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}

function format(value: number | null, suffix = "") {
  return value === null ? "—" : `${value.toFixed(1)}${suffix}`;
}

function topBy(players: StatcastPlayer[], key: keyof StatcastPlayer, ascending = false) {
  return [...players]
    .filter((player) => typeof player[key] === "number")
    .sort((a, b) => {
      const firstValue = a[key] as number;
      const secondValue = b[key] as number;
      return ascending ? firstValue - secondValue : secondValue - firstValue;
    });
}

function Spotlight({ label, player, value }: { label: string; player?: StatcastPlayer; value: string }) {
  if (!player) return null;

  return (
    <Link href={`/players/${player.id}`} className={styles.spotlightCard}>
      <span className="eyebrow">{label}</span>
      <div className={styles.spotlightPlayer}>
        <img src={headshot(player.id)} alt="" width={72} height={72} />
        <div>
          <h2>{player.name}</h2>
          <p>{player.team}</p>
        </div>
      </div>
      <strong>{value}</strong>
    </Link>
  );
}

function AnalyticsTable({ players, pitcher = false }: { players: StatcastPlayer[]; pitcher?: boolean }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>BBE</th>
            <th>{pitcher ? "Avg EV Against" : "Avg EV"}</th>
            <th>{pitcher ? "Max EV Against" : "Max EV"}</th>
            <th>Launch Angle</th>
            <th>Hard-Hit %</th>
            <th>Barrel %</th>
            <th>Sweet-Spot %</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.id}>
              <td className={styles.rank}>{index + 1}</td>
              <td>
                <Link className={styles.playerCell} href={`/players/${player.id}`}>
                  <img src={headshot(player.id)} alt="" width={42} height={42} />
                  <span><strong>{player.name}</strong><small>{player.team}</small></span>
                </Link>
              </td>
              <td>{player.bbe}</td>
              <td><strong>{format(player.avgExitVelocity, " mph")}</strong></td>
              <td>{format(player.maxExitVelocity, " mph")}</td>
              <td>{format(player.launchAngle, "°")}</td>
              <td>{format(player.hardHitRate, "%")}</td>
              <td>{format(player.barrelRate, "%")}</td>
              <td>{format(player.sweetSpot, "%")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function StatcastPage() {
  const [batters, pitchers] = await Promise.all([getStatcast("batter"), getStatcast("pitcher")]);
  const qualifiedBatters = topBy(batters, "avgExitVelocity").slice(0, 25);
  const contactManagers = topBy(pitchers, "avgExitVelocity", true).slice(0, 25);
  const hardestHitter = topBy(batters, "avgExitVelocity")[0];
  const hardHitLeader = topBy(batters, "hardHitRate")[0];
  const barrelLeader = topBy(batters, "barrelRate")[0];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className="eyebrow">Advanced metrics</span>
        <h1>Statcast Analytics</h1>
        <p>Explore how hard players hit the ball, their ideal-contact rates, and which pitchers suppress the strongest contact.</p>
      </header>

      <section className={styles.spotlightGrid} aria-label="Statcast leaders">
        <Spotlight label="Average Exit Velocity" player={hardestHitter} value={format(hardestHitter?.avgExitVelocity ?? null, " mph")} />
        <Spotlight label="Hard-Hit Rate" player={hardHitLeader} value={format(hardHitLeader?.hardHitRate ?? null, "%")} />
        <Spotlight label="Barrel Rate" player={barrelLeader} value={format(barrelLeader?.barrelRate ?? null, "%")} />
      </section>

      <section className={styles.metricGuide}>
        <div><strong>Exit Velocity</strong><span>Speed of the ball off the bat.</span></div>
        <div><strong>Hard-Hit Rate</strong><span>Share of batted balls hit at least 95 mph.</span></div>
        <div><strong>Barrel Rate</strong><span>Ideal combinations of exit velocity and launch angle.</span></div>
        <div><strong>Sweet-Spot Rate</strong><span>Batted balls launched between 8° and 32°.</span></div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div><span className="eyebrow">Qualified batters</span><h2>Impact Contact Leaders</h2></div>
          <p>Sorted by average exit velocity.</p>
        </header>
        {qualifiedBatters.length ? <AnalyticsTable players={qualifiedBatters} /> : <p className={styles.empty}>Qualified batter data is not yet available for {CURRENT_SEASON}.</p>}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div><span className="eyebrow">Qualified pitchers</span><h2>Contact Management</h2></div>
          <p>Lowest average exit velocity allowed.</p>
        </header>
        {contactManagers.length ? <AnalyticsTable players={contactManagers} pitcher /> : <p className={styles.empty}>Qualified pitcher data is not yet available for {CURRENT_SEASON}.</p>}
      </section>

      <p className={styles.sourceNote}>Statcast data is supplied by MLB Baseball Savant and updates periodically throughout the season.</p>
    </div>
  );
}
