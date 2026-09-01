import type { LiveGameSituation, PitchBadge } from "@/lib/live-situations";

function headshotUrl(playerId?: number): string {
  return playerId
    ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_96,q_auto:best,f_auto/v1/people/${playerId}/headshot/67/current`
    : "";
}

function MiniDiamond({ situation }: { situation: LiveGameSituation }) {
  return (
    <div className="miniDiamond" aria-label={`${situation.outs} outs; runners on ${[
      situation.firstOccupied && "first",
      situation.secondOccupied && "second",
      situation.thirdOccupied && "third",
    ].filter(Boolean).join(", ") || "no bases"}`}>
      <span className={`miniBase miniSecond${situation.secondOccupied ? " occupied" : ""}`} />
      <span className={`miniBase miniThird${situation.thirdOccupied ? " occupied" : ""}`} />
      <span className={`miniBase miniFirst${situation.firstOccupied ? " occupied" : ""}`} />
      <span className="miniHome" />
    </div>
  );
}

function OutsDisplay({ outs }: { outs: number }) {
  return (
    <div className="miniOuts" aria-label={`${outs} outs`}>
      {[0, 1, 2].map((index) => <span key={index} className={index < outs ? "recorded" : ""} />)}
    </div>
  );
}

function pitchBadgeClass(kind: PitchBadge["kind"]) {
  if (kind === "ball") return "miniPitchBall";
  if (kind === "strike") return "miniPitchStrike";
  if (kind === "foul") return "miniPitchFoul";
  if (kind === "inplay") return "miniPitchInPlay";
  return "miniPitchOther";
}

function PitchSequenceRow({ pitches }: { pitches: PitchBadge[] }) {
  if (!pitches.length) return null;
  return (
    <div className="miniPitchSequence" aria-label="Pitches this at-bat">
      <span>Pitches this AB</span>
      <div className="miniPitchBadges">
        {pitches.map((pitch, index) => (
          <span key={index} className={`miniPitchBadge ${pitchBadgeClass(pitch.kind)}`} title={pitch.label}>
            {pitch.code}
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniPlayer({ label, name, playerId, line }: { label: string; name: string; playerId?: number; line?: string }) {
  return (
    <div className="miniPlayer">
      {playerId
        ? <img src={headshotUrl(playerId)} alt="" width={38} height={38} />
        : <span className="miniPlayerPlaceholder" aria-hidden="true" />}
      <div>
        <span>{label}</span>
        <strong>{name}</strong>
        {line && <em>{line}</em>}
      </div>
    </div>
  );
}

export default function MiniGameCenter({ situation }: { situation: LiveGameSituation }) {
  const batterLine = situation.batterLine
    ? `${situation.batterLine.hits}-${situation.batterLine.atBats}${situation.batterLine.rbi ? `, ${situation.batterLine.rbi} RBI` : ""} today`
    : undefined;
  const pitcherLine = situation.pitcherLine
    ? `${situation.pitcherLine.pitches}p (${situation.pitcherLine.balls}-${situation.pitcherLine.strikes}) · ${situation.pitcherLine.inningsPitched} IP · ${situation.pitcherLine.era} ERA`
    : undefined;

  return (
    <section className="miniGameCenter" aria-label="Current game situation">
      <div className="miniSituationTop">
        <MiniDiamond situation={situation} />
        <div className="miniGameState">
          <div className="miniCount"><strong>{situation.balls}-{situation.strikes}</strong><span>Count</span></div>
          <div className="miniOutBlock"><OutsDisplay outs={situation.outs} /><span>Outs</span></div>
        </div>
      </div>
      <PitchSequenceRow pitches={situation.pitchSequence} />
      <div className="miniMatchup">
        <MiniPlayer label="At bat" name={situation.batter} playerId={situation.batterId} line={batterLine} />
        <MiniPlayer label="Pitching" name={situation.pitcher} playerId={situation.pitcherId} line={pitcherLine} />
      </div>
      {situation.latestPlay && <div className="miniLatestPlay"><span>Latest play</span><strong>{situation.latestPlay}</strong></div>}
    </section>
  );
}
