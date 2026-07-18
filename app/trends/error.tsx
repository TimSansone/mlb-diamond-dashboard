"use client";

import Link from "next/link";

export default function TrendsError({ reset }: { reset: () => void }) {
  return (
    <section className="emptyState">
      <span className="emptyIcon">📊</span>
      <h1>Stats &amp; Trends could not load</h1>
      <p>The MLB data service may be temporarily unavailable. Try the request again or return to today’s scoreboard.</p>
      <div className="errorActions">
        <button className="dateButton" onClick={() => reset()}>Try again</button>
        <Link className="dateButton secondary" href="/">Scoreboard</Link>
      </div>
    </section>
  );
}
