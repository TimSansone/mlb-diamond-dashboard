export type LeagueRecord = {
  wins: number;
  losses: number;
  pct?: string;
};

export type MlbTeamSide = {
  score?: number;
  isWinner?: boolean;
  leagueRecord?: LeagueRecord;
  team: {
    id: number;
    name: string;
  };
  probablePitcher?: {
    id: number;
    fullName: string;
  };
};

export type MlbGame = {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  status: {
    abstractGameState: "Preview" | "Live" | "Final" | string;
    detailedState: string;
  };
  teams: {
    away: MlbTeamSide;
    home: MlbTeamSide;
  };
  venue?: {
    id: number;
    name: string;
  };
  linescore?: {
    currentInning?: number;
    currentInningOrdinal?: string;
    inningState?: string;
    inningHalf?: string;
  };
};

export type MlbScheduleResponse = {
  totalGames: number;
  dates?: Array<{
    date: string;
    games: MlbGame[];
  }>;
};

export type StandingsSplit = {
  type: string;
  wins: number;
  losses: number;
  pct?: string;
};

export type StandingsTeamRecord = {
  team: { id: number; name: string };
  season: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winningPercentage: string;
  gamesBack: string;
  divisionRank?: string;
  leagueRank?: string;
  wildCardRank?: string;
  wildCardGamesBack?: string;
  streak?: { streakCode: string };
  records?: { splitRecords?: StandingsSplit[] };
};

export type StandingsGroup = {
  standingsType: string;
  league?: { id: number; name: string };
  division?: { id: number; name: string };
  teamRecords: StandingsTeamRecord[];
};

export type StandingsResponse = {
  records: StandingsGroup[];
};