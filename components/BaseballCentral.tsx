import Link from "next/link";
import type { BaseballCentralData, DailyHighlight, DailyPlayerLeader } from "@/lib/baseball-central";
import styles from "./BaseballCentral.module.css";

const headshot = (playerId?: number) => playerId
  ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_96,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`
  : "";

function LeaderList({ title, eyebrow, leaders, suffix }: { title: string; eyebrow: string; leaders: DailyPlayerLeader[]; suffix: string }) {
  return (
    <section className={styles.leaderCard}>
      <div className={styles.cardHeader}>
        <div><span>{eyebrow}</span><h3>{title}</h3></div>
        <b>Today</b>
      </div>
      {leaders.length ? (
        <ol className={styles.leaderList}>
          {leaders.map((leader, index) => (
            <li key={`${leader.playerId ?? leader.name}-${index}`}>
              <span className={styles.rank}>{index + 1}</span>
              {leader.playerId ? <img src={headshot(leader.playerId)} alt="" width={46} height={46} /> : <span className={styles.avatarPlaceholder}>⚾</span>}
              <div className={styles.playerIdentity}>
                {leader.playerId ? <Link href={`/players/${leader.playerId}`}>{leader.name}</Link> : <strong>{leader.name}</strong>}
                <small>{leader.team || leader.detail || "MLB"}</small>
              </div>
              <strong className={styles.leaderValue}>{leader.value} <small>{suffix}</small></strong>
            </li>
          ))}
        </ol>
      ) : <p className={styles.empty}>No qualifying performances are available yet.</p>}
    </section>
  );
}

function HighlightCard({ highlight, icon }: { highlight?: DailyHighlight; icon: string }) {
  const content = (
    <article className={styles.highlightCard}>
      <div className={styles.highlightIcon}>{icon}</div>
      <span>{highlight?.title ?? "Waiting for game data"}</span>
      <strong>{highlight?.value ?? "—"}</strong>
      <p>{highlight?.detail ?? "This card will update as today’s games produce qualifying plays."}</p>
    </article>
  );
  return highlight?.gamePk ? <Link className={styles.highlightLink} href={`/games/${highlight.gamePk}`}>{content}</Link> : content;
}

export default function BaseballCentral({ data, selectedDate, isToday }: { data: BaseballCentralData; selectedDate: string; isToday: boolean }) {
  return (
    <section className={styles.centralSection}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Baseball Central</span>
          <h2>{isToday ? "What’s happening around MLB today" : `Daily MLB highlights for ${selectedDate}`}</h2>
          <p>Live leaders, Statcast-style highlights, comeback tracking, and the day’s most compelling game.</p>
        </div>
        <div className={styles.feedStatus}><i /> {data.feedsLoaded} game feed{data.feedsLoaded === 1 ? "" : "s"} analyzed</div>
      </div>

      <div className={styles.leaderGrid}>
        <LeaderList title="Home run leaders" eyebrow="Power watch" leaders={data.homeRunLeaders} suffix="HR" />
        <LeaderList title="Strikeout leaders" eyebrow="Pitching watch" leaders={data.strikeoutLeaders} suffix="K" />
      </div>

      <div className={styles.highlightGrid}>
        <HighlightCard highlight={data.longestHomeRun} icon="📏" />
        <HighlightCard highlight={data.hardestHit} icon="💥" />
        <HighlightCard highlight={data.fastestPitch} icon="🔥" />
        <HighlightCard highlight={data.biggestComeback} icon="↗" />
        <HighlightCard highlight={data.mostExcitingGame} icon="⚡" />
      </div>
    </section>
  );
}
