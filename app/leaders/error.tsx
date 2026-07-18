"use client";

export default function LeadersError({ reset }: { reset: () => void }) {
  return (
    <section className="emptyState">
      <span className="eyebrow">Something went wrong</span>
      <h1>We could not load MLB league leaders.</h1>
      <p>The MLB data service may be temporarily unavailable. Please try again.</p>
      <button className="dateButton" onClick={() => reset()}>Try again</button>
    </section>
  );
}
