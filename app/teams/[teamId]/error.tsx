"use client";

import Link from "next/link";

export default function TeamError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="emptyState">
      <span className="eyebrow">Team page unavailable</span>
      <h1>We could not load this team right now.</h1>
      <p>The MLB data service may be temporarily unavailable. Try the request again or return to the team directory.</p>
      <div className="errorActions">
        <button className="dateButton" type="button" onClick={() => reset()}>Try again</button>
        <Link className="dateButton secondary" href="/teams">All teams</Link>
      </div>
    </section>
  );
}
