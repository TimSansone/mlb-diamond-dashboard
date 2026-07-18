"use client";

export default function StatcastError({ reset }: { reset: () => void }) {
  return (
    <section className="emptyState">
      <span className="emptyIcon">⚾</span>
      <h1>Statcast data is unavailable</h1>
      <p>MLB Baseball Savant did not return the analytics data. This can happen briefly while the source is updating.</p>
      <button className="button buttonPrimary" type="button" onClick={reset}>Try again</button>
    </section>
  );
}
