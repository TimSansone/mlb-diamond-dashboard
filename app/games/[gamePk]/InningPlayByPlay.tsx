import styles from "./game.module.css";

type Play = {
  result?: { description?: string; event?: string; awayScore?: number; homeScore?: number };
  about?: { inning?: number; halfInning?: string; atBatIndex?: number; isComplete?: boolean };
  count?: { balls?: number; strikes?: number; outs?: number };
};

function ordinal(value: number) {
  const remainder100 = value % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1: return `${value}st`;
    case 2: return `${value}nd`;
    case 3: return `${value}rd`;
    default: return `${value}th`;
  }
}

export default function InningPlayByPlay({ plays, currentInning }: { plays: Play[]; currentInning?: number }) {
  const completed = plays.filter(
    (play) => play.about?.inning && play.about?.isComplete !== false && Boolean(play.result?.description || play.result?.event),
  );

  const grouped = completed.reduce<Map<number, Play[]>>((map, play) => {
    const inning = play.about!.inning!;
    const inningPlays = map.get(inning) ?? [];
    inningPlays.push(play);
    map.set(inning, inningPlays);
    return map;
  }, new Map());

  const innings = [...grouped.keys()].sort((a, b) => b - a);
  const defaultInning = currentInning && grouped.has(currentInning) ? currentInning : innings[0];

  if (!innings.length) {
    return <p className={styles.empty}>Play-by-play will appear when the game begins.</p>;
  }

  return (
    <div className={styles.inningAccordion}>
      {innings.map((inning) => {
        const inningPlays = grouped.get(inning) ?? [];
        return (
          <details key={inning} className={styles.inningDetails} open={inning === defaultInning}>
            <summary>
              <span>{ordinal(inning)} inning</span>
              <small>{inningPlays.length} {inningPlays.length === 1 ? "play" : "plays"}</small>
            </summary>
            <ol className={`${styles.playList} ${styles.inningPlayList}`}>
              {inningPlays.map((play, index) => (
                <li key={`${inning}-${play.about?.atBatIndex ?? index}`}>
                  <div>
                    <span>{play.about?.halfInning} {inning}</span>
                    {play.result?.awayScore !== undefined ? (
                      <b>{play.result.awayScore}–{play.result.homeScore}</b>
                    ) : play.count ? (
                      <b>{play.count.balls ?? 0}-{play.count.strikes ?? 0}, {play.count.outs ?? 0} out</b>
                    ) : null}
                  </div>
                  <p>{play.result?.description ?? play.result?.event ?? "Play update"}</p>
                </li>
              ))}
            </ol>
          </details>
        );
      })}
    </div>
  );
}
