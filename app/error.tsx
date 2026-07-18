"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="emptyState" role="alert">
      <span className="eyebrow">Something went wrong</span>
      <h1>We could not load the MLB scoreboard.</h1>
      <p>The MLB data service may be temporarily unavailable. Please try again.</p>
      <button className="dateButton" type="button" onClick={() => reset()}>
        Try again
      </button>
    </section>
  );
}
