import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../players.module.css";

const API = "https://statsapi.mlb.com/api/v1";

type StatSplit = { stat?: Record<string, string | number | undefined> };
type StatGroup = {
  type?: { displayName?: string };
  group?: { displayName?: string };
  splits?: StatSplit[];
};
type Player = {
  id: number;
  fullName: string;
  primaryNumber?: string;
  birthDate?: string;
  currentAge?: number;
  birthCity?: string;
  birthStateProvince?: string;
  birthCountry?: string;
  height?: string;
  weight?: number;
  batSide?: { description?: string };
  pitchHand?: { description?: string };
  primaryPosition?: { name?: string; abbreviation?: string };
  currentTeam?: { id: number; name: string };
  stats?: StatGroup[];
};
type PeopleResponse = { people?: Player[] };

async function getPlayer(id: string) {
  const hydrate = "currentTeam,stats(group=[hitting,pitching],type=[season,career],sportId=1)";
  const response = await fetch(`${API}/people/${id}?hydrate=${encodeURIComponent(hydrate)}`, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`MLB player request failed: ${response.status}`);
  const data = (await response.json()) as PeopleResponse;
  const player = data.people?.[0];
  if (!player) notFound();
  return player;
}

function headshot(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}
function teamLogo(id?: number) {
  return id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : "";
}
function value(stat: Record<string, string | number | undefined> | undefined, key: string) {
  return stat?.[key] ?? "—";
}
function findStat(player: Player, group: string, type: string) {
  return player.stats?.find(
    (item) => item.group?.displayName?.toLowerCase() === group && item.type?.displayName?.toLowerCase() === type,
  )?.splits?.[0]?.stat;
}

function StatCards({ stat, pitching = false }: { stat?: Record<string, string | number | undefined>; pitching?: boolean }) {
  const rows = pitching
    ? [["Games", "gamesPlayed"], ["Wins", "wins"], ["ERA", "era"], ["WHIP", "whip"], ["Strikeouts", "strikeOuts"], ["Saves", "saves"]]
    : [["Games", "gamesPlayed"], ["AVG", "avg"], ["Home Runs", "homeRuns"], ["RBI", "rbi"], ["OPS", "ops"], ["Stolen Bases", "stolenBases"]];
  return <div className={styles.statsGrid}>{rows.map(([label, key]) => <div className={styles.statCard} key={key}><span>{label}</span><strong>{value(stat, key)}</strong></div>)}</div>;
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  if (!/^\d+$/.test(playerId)) notFound();
  const player = await getPlayer(playerId);
  const seasonHitting = findStat(player, "hitting", "season");
  const careerHitting = findStat(player, "hitting", "career");
  const seasonPitching = findStat(player, "pitching", "season");
  const careerPitching = findStat(player, "pitching", "career");
  const birthplace = [player.birthCity, player.birthStateProvince, player.birthCountry].filter(Boolean).join(", ") || "—";

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} href="/players">← Back to player search</Link>
      <header className={styles.profileHero}>
        <img className={styles.profilePhoto} src={headshot(player.id)} alt={`${player.fullName} headshot`} width={180} height={180} />
        <div>
          <span className="eyebrow">Player profile</span>
          <div className={styles.profileNameRow}>
            <h1>{player.fullName}</h1>
            {player.primaryPosition?.abbreviation ? <span className={styles.positionBadge}>{player.primaryPosition.abbreviation}</span> : null}
          </div>
          {player.currentTeam ? <div className={styles.teamLine}><img src={teamLogo(player.currentTeam.id)} alt="" width={38} height={38} /><strong>{player.currentTeam.name}</strong>{player.primaryNumber ? <span>#{player.primaryNumber}</span> : null}</div> : <p>Current team unavailable</p>}
        </div>
      </header>

      <section className={styles.bioGrid}>
        <div className={styles.statCard}><span>Position</span><strong>{player.primaryPosition?.name ?? "—"}</strong></div>
        <div className={styles.statCard}><span>Bats / Throws</span><strong>{player.batSide?.description ?? "—"} / {player.pitchHand?.description ?? "—"}</strong></div>
        <div className={styles.statCard}><span>Height / Weight</span><strong>{player.height ?? "—"} / {player.weight ? `${player.weight} lb` : "—"}</strong></div>
        <div className={styles.statCard}><span>Born</span><strong>{player.birthDate ?? "—"}{player.currentAge ? ` (Age ${player.currentAge})` : ""}</strong></div>
      </section>
      <div className={styles.statCard}><span>Birthplace</span><strong>{birthplace}</strong></div>

      {seasonHitting ? <section className={styles.section}><h2>Season Hitting</h2><StatCards stat={seasonHitting} /></section> : null}
      {seasonPitching ? <section className={styles.section}><h2>Season Pitching</h2><StatCards stat={seasonPitching} pitching /></section> : null}
      {careerHitting ? <section className={styles.section}><h2>Career Hitting</h2><StatCards stat={careerHitting} /></section> : null}
      {careerPitching ? <section className={styles.section}><h2>Career Pitching</h2><StatCards stat={careerPitching} pitching /></section> : null}
      {!seasonHitting && !seasonPitching && !careerHitting && !careerPitching ? <p className={styles.notice}>No MLB statistics are currently available for this player.</p> : null}
    </div>
  );
}
