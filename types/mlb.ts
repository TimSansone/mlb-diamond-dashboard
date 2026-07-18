export type LeagueRecord = {
  wins: number;
  losses: number;
  pct?: string;
};

export type MlbTeamSide = {
  score?: number;
  isWinner?: boolean;
  leagueRecord?: LeagueRecord;
  team: { id: number; name: string };
  probablePitcher?: { id: number; fullName: string };
};

export type MlbGame = {
  gamePk: number;
  gameDate: string;
  officialDate: string;
  status: {
    abstractGameState: "Preview" | "Live" | "Final" | string;
    detailedState: string;
  };
  teams: { away: MlbTeamSide; home: MlbTeamSide };
  venue?: { id: number; name: string };
  linescore?: {
    currentInning?: number;
    currentInningOrdinal?: string;
    inningState?: string;
    inningHalf?: string;
  };
};

export type MlbScheduleResponse = {
  totalGames: number;
  dates?: Array<{ date: string; games: MlbGame[] }>;
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
  sportRank?: string;
  wildCardRank?: string;
  wildCardGamesBack?: string;
  runsScored?: number;
  runsAllowed?: number;
  runDifferential?: number;
  eliminationNumber?: string;
  wildCardEliminationNumber?: string;
  divisionChamp?: boolean;
  divisionLeader?: boolean;
  wildCardLeader?: boolean;
  clinched?: boolean;
  streak?: { streakCode: string };
  records?: { splitRecords?: StandingsSplit[] };
};

export type StandingsGroup = {
  standingsType: string;
  league?: { id: number; name: string };
  division?: { id: number; name: string };
  teamRecords: StandingsTeamRecord[];
};

export type StandingsResponse = { records: StandingsGroup[] };

export type MlbTeam = {
  id: number;
  name: string;
  teamName?: string;
  abbreviation?: string;
  locationName?: string;
  firstYearOfPlay?: string;
  division?: { id: number; name: string };
  league?: { id: number; name: string };
  venue?: { id: number; name: string };
};

export type MlbTeamsResponse = { teams: MlbTeam[] };

export type RosterPerson = {
  person: { id: number; fullName: string };
  jerseyNumber?: string;
  position: { abbreviation: string; name: string; type: string };
  status?: { description?: string };
};

export type RosterResponse = { roster: RosterPerson[] };

export type TeamLeader = {
  rank: number;
  value: string;
  person: { id: number; fullName: string };
  team?: { id: number; name: string };
};

export type TeamLeaderCategory = {
  leaderCategory: string;
  gameType?: { id: string; description: string };
  leaders: TeamLeader[];
};

export type TeamLeadersResponse = { leagueLeaders: TeamLeaderCategory[] };
