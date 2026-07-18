import Link from "next/link";

function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function formatHeading(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default function DateNavigator({ date, today }: { date: string; today: string }) {
  const previousDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);

  return (
    <div className="dateNavigator" aria-label="Scoreboard date navigation">
      <Link className="dateButton" href={`/?date=${previousDate}`} aria-label="Previous day">
        ← Previous
      </Link>

      <div className="dateHeading">
        <span className="eyebrow">MLB scoreboard</span>
        <h1>{formatHeading(date)}</h1>
      </div>

      <div className="dateActions">
        {date !== today ? (
          <Link className="dateButton secondary" href="/">
            Today
          </Link>
        ) : null}
        <Link className="dateButton" href={`/?date=${nextDate}`} aria-label="Next day">
          Next →
        </Link>
      </div>
    </div>
  );
}
