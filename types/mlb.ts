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
