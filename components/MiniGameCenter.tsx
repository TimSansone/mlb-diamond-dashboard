import type { LiveGameSituation } from "@/lib/live-situations";

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

function MiniPlayer({ label, name, playerId }: { label: string; name: string; playerId?: number }) {
  return (
    <div className="miniPlayer">
      {playerId
        ? <img src={headshotUrl(playerId)} alt="" width={38} height={38} />
        : <span className="miniPlayerPlaceholder" aria-hidden="true" />}
      <div><span>{label}</span><strong>{name}</strong></div>
    </div>
  );
}

export default function MiniGameCenter({ situation }: { situation: LiveGameSituation }) {
  return (
    <section className="miniGameCenter" aria-label="Current game situation">
      <div className="miniSituationTop">
        <MiniDiamond situation={situation} />
        <div className="miniGameState">
          <div className="miniCount"><strong>{situation.balls}-{situation.strikes}</strong><span>Count</span></div>
          <div className="miniOutBlock"><OutsDisplay outs={situation.outs} /><span>Outs</span></div>
        </div>
      </div>
      <div className="miniMatchup">
        <MiniPlayer label="At bat" name={situation.batter} playerId={situation.batterId} />
        <MiniPlayer label="Pitching" name={situation.pitcher} playerId={situation.pitcherId} />
      </div>
      {situation.lastPitch && <div className="miniLastPitch"><span>Last pitch</span><strong>{situation.lastPitch}</strong></div>}
    </section>
  );
}
