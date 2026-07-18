import styles from "./game.module.css";
import fieldStyles from "./field.module.css";

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

const positions: Array<[keyof Defense, string, string, string]> = [
  ["center", "CF", fieldStyles.center, fieldStyles.outfielder],
  ["left", "LF", fieldStyles.left, fieldStyles.outfielder],
  ["right", "RF", fieldStyles.right, fieldStyles.outfielder],
  ["shortstop", "SS", fieldStyles.shortstop, fieldStyles.infielder],
  ["second", "2B", fieldStyles.second, fieldStyles.infielder],
  ["third", "3B", fieldStyles.third, fieldStyles.infielder],
  ["first", "1B", fieldStyles.first, fieldStyles.infielder],
  ["pitcher", "P", fieldStyles.pitcher, fieldStyles.battery],
  ["catcher", "C", fieldStyles.catcher, fieldStyles.battery],
];

function BaseballField() {
  return (
    <svg className={fieldStyles.fieldSvg} viewBox="0 0 700 520" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fieldSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#132943" />
          <stop offset="1" stopColor="#071421" />
        </linearGradient>
        <radialGradient id="outfieldGrass" cx="50%" cy="84%" r="78%">
          <stop offset="0" stopColor="#3f7c43" />
          <stop offset=".72" stopColor="#285f35" />
          <stop offset="1" stopColor="#1b4729" />
        </radialGradient>
        <pattern id="mowPattern" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform="rotate(10)">
          <rect width="36" height="72" fill="rgba(255,255,255,.035)" />
          <rect x="36" width="36" height="72" fill="rgba(0,0,0,.035)" />
        </pattern>
        <filter id="fieldShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#000" floodOpacity=".42" />
        </filter>
      </defs>

      <rect width="700" height="520" fill="url(#fieldSky)" />
      <path d="M38 84 Q350 8 662 84 L700 142 Q350 52 0 142 Z" fill="#0a1a2a" stroke="#31506a" strokeWidth="3" />
      <path d="M18 118 Q350 30 682 118 L650 398 Q350 505 50 398 Z" fill="url(#outfieldGrass)" filter="url(#fieldShadow)" />
      <path d="M18 118 Q350 30 682 118 L650 398 Q350 505 50 398 Z" fill="url(#mowPattern)" opacity=".9" />

      <path d="M350 458 L92 210 Q350 82 608 210 Z" fill="#b48752" opacity=".96" />
      <path d="M350 436 L130 220 Q350 118 570 220 Z" fill="#3b7440" />
      <path d="M350 436 L130 220 Q350 118 570 220 Z" fill="url(#mowPattern)" opacity=".55" />

      <path d="M350 437 L210 302 L350 214 L490 302 Z" fill="#b48752" stroke="#d5b078" strokeWidth="2" />
      <circle cx="350" cy="337" r="31" fill="#b48752" stroke="#d5b078" strokeWidth="2" />
      <ellipse cx="350" cy="337" rx="13" ry="5" fill="#ead8b0" />

      <line x1="350" y1="457" x2="91" y2="210" stroke="#f5f2df" strokeWidth="3" />
      <line x1="350" y1="457" x2="609" y2="210" stroke="#f5f2df" strokeWidth="3" />

      <g fill="#f7f2dd" stroke="#d8d1b7" strokeWidth="1.5">
        <rect x="341" y="424" width="18" height="18" transform="rotate(45 350 433)" />
        <rect x="462" y="291" width="17" height="17" transform="rotate(45 470.5 299.5)" />
        <rect x="341.5" y="206" width="17" height="17" transform="rotate(45 350 214.5)" />
        <rect x="222" y="291" width="17" height="17" transform="rotate(45 230.5 299.5)" />
      </g>

      <path d="M335 455 L350 468 L365 455 L360 444 L340 444 Z" fill="#f7f2dd" stroke="#d8d1b7" strokeWidth="1.5" />
      <path d="M68 393 Q350 508 632 393" fill="none" stroke="#9b6b3d" strokeWidth="18" opacity=".72" />
      <path d="M52 397 Q350 522 648 397" fill="none" stroke="#d2a66f" strokeWidth="3" opacity=".65" />
    </svg>
  );
}

function DefensiveAlignment({ defense }: { defense?: Defense }) {
  return (
    <section className={`${styles.card} ${styles.featureCard}`}>
      <div className={styles.featureHeader}><span>Defensive alignment</span><small>On the field</small></div>
      <div className={fieldStyles.fieldShell}>
        <BaseballField />
        {positions.map(([key, label, positionClass, depthClass]) => {
          const player = defense?.[key];
          return (
            <div key={key} className={`${fieldStyles.fielder} ${positionClass} ${depthClass}`}>
              <div className={fieldStyles.headshotWrap}>
                {player?.id
                  ? <img src={headshot(player.id)} alt={`${player.fullName ?? label} headshot`} width={48} height={48} />
                  : <span className={fieldStyles.headshotPlaceholder}>{label}</span>}
                <span className={fieldStyles.positionBadge}>{label}</span>
              </div>
              <span className={fieldStyles.playerName}>{shortName(player?.fullName)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function LiveGameFeatures({ playEvents, defense }: { playEvents?: PitchEvent[]; defense?: Defense }) {
  // Some MLB feeds omit details.isPitch even when pitchData is present.
  const pitches = (playEvents ?? []).filter((event) => event.details?.isPitch || Boolean(event.pitchData));
  return (
    <section className={styles.liveFeatureGrid}>
      <PitchSequence pitches={pitches} />
      <PitchTracker pitches={pitches} />
      <DefensiveAlignment defense={defense} />
    </section>
  );
}
