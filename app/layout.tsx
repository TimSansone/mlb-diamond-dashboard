import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "MLB Diamond Dashboard",
  description: "Live MLB scores, analytics, schedules, highlights, and AI recaps.",
  applicationName: "MLB Diamond Dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <Link className="brand" href="/">MLB Diamond Dashboard</Link>
          <nav aria-label="Primary navigation">
            <Link href="/">Scores</Link>
            <Link href="/standings">Standings</Link>
            <Link href="/leaders">Leaders</Link>
            <Link href="/trends">Stats &amp; Trends</Link>
            <Link href="/players">Players</Link>
            <Link href="/teams">Teams</Link>
            <Link href="/schedule">Schedule</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
