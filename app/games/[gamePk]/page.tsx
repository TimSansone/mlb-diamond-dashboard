import Link from "next/link";
import { notFound } from "next/navigation";

type GameFeed = {
  gameData: {
    datetime: { dateTime: string };
    status: { abstractGameState: string; detailedState: string };
    venue?: { name?: string };
    teams: {
      away: { id: number; name: string };
      home: { id: number; name: string };
    };
  };
  liveData: {
    linescore?: {
      currentInningOrdinal?: string;
      inningHalf?: string;
      innings?: Array<{
        num: number;
        away?: { runs?: number; hits?: number; errors?: number };
        home?: { runs?: number; hits?: number; errors?: number };
      }>;
      teams?: {
        away?: { runs?: number; hits?: number; errors?: number };
        home?: { runs?: number; hits?: number; errors?: number };
      };
    };
    plays?: {
      allPlays?: Array<{
        result?: { description?: string; event?: string; rbi?: number };
        about?: { inning?: number; halfInning?: string; isScoringPlay?: boolean };
      }>;
    };
    boxscore?: {
      teams?: {
        away?: { teamStats?: { batting?: Record<string, number | string>; pitching?: Record<string, number | string> } };
        home?: { teamStats?: { batting?: Record<string, number | string>; pitching?: Record<string, number | string> } };
      };
    };
  };
};

function logo(teamId: number) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

async function getGame(gamePk: string): Promise<GameFeed> {
  const response = await fetch(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, {
    next: { revalidate: 15 },
  });

  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Game feed request failed with status ${response.status}`);
  return response.json();
}

function TeamHeader({ team, score }: { team: { id: number; name: string }; score?: number }) {
  return (
    <div className="gameCenterTeam">
      <img src={logo(team.id)} alt="" width={72} height={72} />
      <strong>{team.name}</strong>
      <span>{score ?? 0}</span>
    </div>
  );
}

function StatSummary({ title, stats }: { title: string; stats?: Record<string, number | string> }) {
  const rows = [
    ["Runs", stats?.runs],
    ["Hits", stats?.hits],
    ["Home runs", stats?.homeRuns],
    ["Walks", stats?.baseOnBalls],
    ["Strikeouts", stats?.strikeOuts],
  ];

  return (
    <section className="detailCard">
      <h2>{title}</h2>
      <dl className="statList">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function GameCenterPage({ params }: { params: Promise<{ gamePk: string }> }) {
  const { gamePk } = await params;
  if (!/^\d+$/.test(gamePk)) notFound();

  const game = await getGame(gamePk);
  const { away, home } = game.gameData.teams;
  const line = game.liveData.linescore;
  const awayTotals = line?.teams?.away;
  const homeTotals = line?.teams?.home;
  const innings = line?.innings ?? [];
  const scoringPlays = (game.liveData.plays?.allPlays ?? []).filter((play) => play.about?.isScoringPlay);
  const awayBatting = game.liveData.boxscore?.teams?.away?.teamStats?.batting;
  const homeBatting = game.liveData.boxscore?.teams?.home?.teamStats?.batting;

  return (
    <div className="gameCenter">
      <Link className="backLink" href="/">← Back to scoreboard</Link>

      <header className="gameCenterHero">
        <TeamHeader team={away} score={awayTotals?.runs} />
        <div className="gameCenterStatus">
          <span className="eyebrow">Game Center</span>
          <strong>{game.gameData.status.detailedState}</strong>
          <span>{line?.currentInningOrdinal ? `${line.inningHalf ?? ""} ${line.currentInningOrdinal}`.trim() : game.gameData.venue?.name ?? ""}</span>
        </div>
        <TeamHeader team={home} score={homeTotals?.runs} />
      </header>

      <section className="detailCard lineScoreCard">
        <h2>Line score</h2>
        <div className="tableScroll">
          <table className="lineScoreTable">
            <thead>
              <tr>
                <th>Team</th>
                {innings.map((inning) => <th key={inning.num}>{inning.num}</th>)}
                <th>R</th><th>H</th><th>E</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{away.name}</th>
                {innings.map((inning) => <td key={inning.num}>{inning.away?.runs ?? "—"}</td>)}
                <td>{awayTotals?.runs ?? 0}</td><td>{awayTotals?.hits ?? 0}</td><td>{awayTotals?.errors ?? 0}</td>
              </tr>
              <tr>
                <th>{home.name}</th>
                {innings.map((inning) => <td key={inning.num}>{inning.home?.runs ?? "—"}</td>)}
                <td>{homeTotals?.runs ?? 0}</td><td>{homeTotals?.hits ?? 0}</td><td>{homeTotals?.errors ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="detailGrid">
        <StatSummary title={`${away.name} batting`} stats={awayBatting} />
        <StatSummary title={`${home.name} batting`} stats={homeBatting} />
      </div>

      <section className="detailCard">
        <h2>Scoring plays</h2>
        {scoringPlays.length ? (
          <ol className="playList">
            {scoringPlays.map((play, index) => (
              <li key={`${play.about?.inning}-${index}`}>
                <span>{play.about?.halfInning} {play.about?.inning}</span>
                <p>{play.result?.description ?? play.result?.event ?? "Scoring play"}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mutedText">No scoring plays are available yet.</p>
        )}
      </section>
    </div>
  );
}
