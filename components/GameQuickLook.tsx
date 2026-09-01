"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { parseLiveSituation, type LiveFeed } from "@/lib/live-situations";
import MiniGameCenter from "./MiniGameCenter";

const LIVE_POLL_MS = 15000;

function totalsFor(feed: LiveFeed, side: "away" | "home") {
  return feed.liveData?.linescore?.teams?.[side];
}

export default function GameQuickLook({
  gamePk,
  status,
  awayName,
  homeName,
}: {
  gamePk: number;
  status: string;
  awayName: string;
  homeName: string;
}) {
  const [feed, setFeed] = useState<LiveFeed | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/games/${gamePk}`, { cache: "no-store" });
        if (!response.ok) throw new Error("bad response");
        const data = (await response.json()) as LiveFeed;
        if (!cancelled) {
          setFeed(data);
          setErrored(false);
        }
      } catch {
        if (!cancelled) setErrored(true);
      }
    }

    load();
    const timer = status === "Live" ? window.setInterval(load, LIVE_POLL_MS) : undefined;
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [gamePk, status]);

  if (errored && !feed) {
    return (
      <div className="quickLook">
        <p className="quickLookState">Live details are unavailable right now.</p>
        <Link className="quickLookLink" href={`/games/${gamePk}`}>Open full Game Center →</Link>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="quickLook">
        <p className="quickLookState">Loading live details…</p>
      </div>
    );
  }

  const innings = feed.liveData?.linescore?.innings ?? [];
  const awayTotals = totalsFor(feed, "away");
  const homeTotals = totalsFor(feed, "home");
  const allPlays = feed.liveData?.plays?.allPlays ?? [];
  const latestPlay = [...allPlays].reverse().find((play) => play.result?.description || play.result?.event);
  const decisions = feed.liveData?.decisions;
  const hasDecisions = Boolean(decisions?.winner || decisions?.loser || decisions?.save);

  return (
    <div className="quickLook">
      {innings.length > 0 && (
        <div className="quickLookLine">
          <table>
            <thead>
              <tr>
                <th aria-hidden="true"></th>
                {innings.map((inning) => <th key={inning.num}>{inning.num}</th>)}
                <th>R</th>
                <th>H</th>
                <th>E</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{awayName}</th>
                {innings.map((inning) => <td key={inning.num}>{inning.away?.runs ?? "–"}</td>)}
                <td>{awayTotals?.runs ?? 0}</td>
                <td>{awayTotals?.hits ?? 0}</td>
                <td>{awayTotals?.errors ?? 0}</td>
              </tr>
              <tr>
                <th scope="row">{homeName}</th>
                {innings.map((inning) => <td key={inning.num}>{inning.home?.runs ?? "–"}</td>)}
                <td>{homeTotals?.runs ?? 0}</td>
                <td>{homeTotals?.hits ?? 0}</td>
                <td>{homeTotals?.errors ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {status === "Live" && <MiniGameCenter situation={parseLiveSituation(feed)} />}

      {latestPlay && (
        <p className="quickLookPlay">
          <span>Latest play</span>
          {latestPlay.result?.description ?? latestPlay.result?.event}
        </p>
      )}

      {hasDecisions && (
        <div className="quickLookDecisions">
          {decisions?.winner?.fullName && <span>W: {decisions.winner.fullName}</span>}
          {decisions?.loser?.fullName && <span>L: {decisions.loser.fullName}</span>}
          {decisions?.save?.fullName && <span>SV: {decisions.save.fullName}</span>}
        </div>
      )}

      <Link className="quickLookLink" href={`/games/${gamePk}`}>Open full Game Center →</Link>
    </div>
  );
}
