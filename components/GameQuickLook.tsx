"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  parseLiveSituation,
  type BattingStats,
  type BoxscorePerson,
  type LiveFeed,
  type Play,
  type PitchingStats,
  type TeamBoxscore,
} from "@/lib/live-situations";
import MiniGameCenter from "./MiniGameCenter";

const LIVE_POLL_MS = 15000;

function totalsFor(feed: LiveFeed, side: "away" | "home") {
  return feed.liveData?.linescore?.teams?.[side];
}

function battingLine(stats?: BattingStats) {
  const pieces = [
    `${stats?.hits ?? 0}-${stats?.atBats ?? 0}`,
    stats?.rbi ? `${stats.rbi} RBI` : "",
    stats?.homeRuns ? `${stats.homeRuns} HR` : "",
    stats?.doubles ? `${stats.doubles} 2B` : "",
    stats?.triples ? `${stats.triples} 3B` : "",
    stats?.baseOnBalls ? `${stats.baseOnBalls} BB` : "",
    stats?.strikeOuts ? `${stats.strikeOuts} K` : "",
  ].filter(Boolean);
  return pieces.join(", ");
}

function pitchingLine(stats?: PitchingStats) {
  if (!stats) return null;
  const pieces = [
    `${stats.inningsPitched ?? "0.0"} IP`,
    `${stats.hits ?? 0} H`,
    `${stats.earnedRuns ?? 0} ER`,
    `${stats.strikeOuts ?? 0} K`,
    `${stats.baseOnBalls ?? 0} BB`,
    stats.era ? `${stats.era} ERA` : "",
  ].filter(Boolean);
  return pieces.join(", ");
}

function playersById(team?: TeamBoxscore) {
  return new Map(
    Object.values(team?.players ?? {})
      .filter((player) => player.person?.id)
      .map((player) => [player.person!.id!, player]),
  );
}

function orderedBatters(team?: TeamBoxscore): BoxscorePerson[] {
  const byId = playersById(team);
  const order = team?.battingOrder ?? [];
  const starters = order.map((id) => byId.get(id)).filter(Boolean) as BoxscorePerson[];
  const subIds = [...new Set(team?.batters ?? [])].filter((id) => !order.includes(id));
  const subs = subIds.map((id) => byId.get(id)).filter(Boolean) as BoxscorePerson[];
  return [...starters, ...subs];
}

function teamPitchers(team?: TeamBoxscore): BoxscorePerson[] {
  const byId = playersById(team);
  return [...new Set(team?.pitchers ?? [])].map((id) => byId.get(id)).filter(Boolean) as BoxscorePerson[];
}

function TeamPerformance({ teamName, team }: { teamName: string; team?: TeamBoxscore }) {
  const batters = orderedBatters(team);
  const pitchers = teamPitchers(team);

  return (
    <div className="quickLookTeam">
      <h3>{teamName}</h3>
      {batters.length > 0 ? (
        <ol className="quickLookLineup">
          {batters.map((player, index) => (
            <li key={`${player.person?.id}-${index}`}>
              <span className="quickLookSlot">{index + 1}</span>
              <span className="quickLookPlayerName">
                {player.person?.fullName ?? "Player"}
                <small>{player.position?.abbreviation ?? "—"}</small>
              </span>
              <span className="quickLookPlayerLine">{battingLine(player.stats?.batting)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="quickLookState">Lineup not yet available.</p>
      )}

      {pitchers.length > 0 && (
        <ul className="quickLookPitchers">
          {pitchers.map((player, index) => {
            const line = pitchingLine(player.stats?.pitching);
            return line ? (
              <li key={`${player.person?.id}-${index}`}>
                <span className="quickLookPlayerName">{player.person?.fullName ?? "Player"}</span>
                <span className="quickLookPlayerLine">{line}</span>
              </li>
            ) : null;
          })}
        </ul>
      )}
    </div>
  );
}

function ScoringPlays({ plays, awayName, homeName }: { plays: Play[]; awayName: string; homeName: string }) {
  if (!plays.length) return null;
  return (
    <div className="quickLookScoring">
      <h3>Scoring plays</h3>
      <ol>
        {plays.map((play, index) => (
          <li key={index}>
            <div className="quickLookScoringMeta">
              <span>{play.about?.halfInning} {play.about?.inning}</span>
              {play.result?.awayScore !== undefined && (
                <strong>{awayName} {play.result.awayScore} – {homeName} {play.result.homeScore}</strong>
              )}
            </div>
            <p>{play.result?.description ?? play.result?.event ?? "Scoring play"}</p>
          </li>
        ))}
      </ol>
    </div>
  );
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
  const scoringPlays = allPlays.filter((play) => play.about?.isScoringPlay);
  const latestPlay = status !== "Live"
    ? [...allPlays].reverse().find((play) => play.result?.description || play.result?.event)
    : undefined;
  const decisions = feed.liveData?.decisions;
  const hasDecisions = Boolean(decisions?.winner || decisions?.loser || decisions?.save);
  const awayBox = feed.liveData?.boxscore?.teams?.away;
  const homeBox = feed.liveData?.boxscore?.teams?.home;

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

      <ScoringPlays plays={scoringPlays} awayName={awayName} homeName={homeName} />

      <div className="quickLookPerformances">
        <h3 className="quickLookSectionTitle">Lineups &amp; performances</h3>
        <TeamPerformance teamName={awayName} team={awayBox} />
        <TeamPerformance teamName={homeName} team={homeBox} />
      </div>

      <Link className="quickLookLink" href={`/games/${gamePk}`}>Open full Game Center →</Link>
    </div>
  );
}
