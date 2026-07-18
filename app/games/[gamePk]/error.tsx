"use client";

import Link from "next/link";

export default function GameCenterError({ reset }: { reset: () => void }) {
  return (
    <section className="emptyState" role="alert">
      <span className="eyebrow">Game Center unavailable</span>
      <h1>We could not load this game.</h1>
      <p>The MLB live feed may be temporarily unavailable.</p>
      <div className="errorActions">
        <button className="dateButton" type="button" onClick={() => reset()}>Try again</button>
        <Link className="dateButton secondary" href="/">Back to scoreboard</Link>
      </div>
    </section>
  );
}
