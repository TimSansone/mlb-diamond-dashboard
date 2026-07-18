import styles from "./game.module.css";

type Person = { id?: number; fullName?: string };

type PitchEvent = {
  details?: {
    isPitch?: boolean;
    description?: string;
    call?: { description?: string; code?: string };
    type?: { description?: string; code?: string };
  };
  pitchData?: {
    startSpeed?: number;
    strikeZoneTop?: number;
    strikeZoneBottom?: number;
    coordinates?: { pX?: number; pZ?: number };
  };
  count?: { balls?: number; strikes?: number; outs?: number };
};

type Defense = {
  pitcher?: Person;
  catcher?: Person;
  first?: Person;
  second?: Person;
  third?: Person;
  shortstop?: Person;
  left?: Person;
  center?: Person;
  right?: Person;
};

const headshot = (id?: number) => id
  ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_96,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`
  : "";

function shortName(name?: string) {
  if (!name) return "—";
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0][0]}. ${parts.at(-1)}` : name;
}

function pitchColor(code?: string) {
  if (["FF", "FT", "SI", "FC"].includes(code ?? "")) return styles.pitchFastball;
  if (["SL", "ST", "CU", "KC", "SV"].includes(code ?? "")) return styles.pitchBreaking;
  if (["CH", "FS", "FO", "SC"].includes(code ?? "")) return styles.pitchOffspeed;
  return styles.pitchOther;
}

function PitchSequence({ pitches }: { pitches: PitchEvent[] }) {
  return (
    <section className={`${styles.card} ${styles.featureCard}`}>
      <div className={styles.featureHeader}><span>Pitch sequence</span><small>{pitches.length} pitches</small></div>
      {pitches.length ? (
        <ol className={styles.pitchSequence}>
          {pitches.map((pitch, index) => (
            <li key={index}>
              <span className={`${styles.pitchNumber} ${pitchColor(pitch.details?.type?.code)}`}>{index + 1}</span>
              <strong>{pitch.pitchData?.startSpeed ? `${pitch.pitchData.startSpeed.toFixed(1)} MPH` : "—"}</strong>
              <span>{pitch.details?.type?.description ?? "Pitch"}</span>
              <small>{pitch.details?.call?.description ?? pitch.details?.description ?? "—"}</small>
            </li>
          ))}
        </ol>
      ) : <p className={styles.empty}>Pitch data will appear when the at-bat begins.</p>}
    </section>
  );
}

function PitchTracker({ pitches }: { pitches: PitchEvent[] }) {
  const located = pitches.filter((pitch) => pitch.pitchData?.coordinates?.pX !== undefined && pitch.pitchData?.coordinates?.pZ !== undefined);
  const zoneTop = located.at(-1)?.pitchData?.strikeZoneTop ?? 3.5;
  const zoneBottom = located.at(-1)?.pitchData?.strikeZoneBottom ?? 1.5;

  return (
    <section className={`${styles.card} ${styles.featureCard} ${styles.trackerCard}`}>
      <div className={styles.featureHeader}><span>Pitch tracker</span><small>Current at-bat</small></div>
      <div className={styles.pitchScene}>
        <div className={styles.strikeZone} aria-label="Strike zone">
          {located.map((pitch, index) => {
            const x = Math.max(3, Math.min(97, 50 + (pitch.pitchData!.coordinates!.pX! / 2.2) * 50));
            const zRange = Math.max(.1, zoneTop - zoneBottom);
            const y = Math.max(3, Math.min(97, 100 - ((pitch.pitchData!.coordinates!.pZ! - zoneBottom) / zRange) * 100));
            return <span key={index} className={`${styles.trackedPitch} ${pitchColor(pitch.details?.type?.code)}`} style={{ left: `${x}%`, top: `${y}%` }}>{index + 1}</span>;
          })}
        </div>
      </div>
      <div className={styles.pitchLegend}>
        <span><i className={styles.pitchFastball} /> Fastball</span>
        <span><i className={styles.pitchBreaking} /> Breaking</span>
        <span><i className={styles.pitchOffspeed} /> Offspeed</span>
      </div>
    </section>
  );
}

const positions: Array<[keyof Defense, string, string]> = [
  ["center", "CF", styles.fielderCenter], ["left", "LF", styles.fielderLeft], ["right", "RF", styles.fielderRight],
  ["shortstop", "SS", styles.fielderShort], ["second", "2B", styles.fielderSecond], ["third", "3B", styles.fielderThird],
  ["first", "1B", styles.fielderFirst], ["pitcher", "P", styles.fielderPitcher], ["catcher", "C", styles.fielderCatcher],
];

function DefensiveAlignment({ defense }: { defense?: Defense }) {
  return (
    <section className={`${styles.card} ${styles.featureCard}`}>
      <div className={styles.featureHeader}><span>Defensive alignment</span><small>On the field</small></div>
      <div className={styles.fieldGraphic}>
        {positions.map(([key, label, className]) => {
          const player = defense?.[key];
          return (
            <div key={key} className={`${styles.fielder} ${className}`}>
              {player?.id ? <img src={headshot(player.id)} alt="" width={38} height={38} /> : <span />}
              <b>{label}</b><small>{shortName(player?.fullName)}</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function LiveGameFeatures({ playEvents, defense }: { playEvents?: PitchEvent[]; defense?: Defense }) {
  const pitches = (playEvents ?? []).filter((event) => event.details?.isPitch);
  return (
    <section className={styles.liveFeatureGrid}>
      <PitchSequence pitches={pitches} />
      <PitchTracker pitches={pitches} />
      <DefensiveAlignment defense={defense} />
    </section>
  );
}
