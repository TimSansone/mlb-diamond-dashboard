"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import styles from "./players.module.css";

type Player = {
  id: number;
  fullName: string;
  primaryPosition?: { abbreviation?: string; name?: string };
  currentTeam?: { id: number; name: string };
};

type SearchResponse = { people?: Player[] };

function headshot(id: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_160,q_auto:best,f_auto/v1/people/${id}/headshot/67/current`;
}

function teamLogo(id?: number) {
  return id ? `https://www.mlbstatic.com/team-logos/${id}.svg` : "";
}

export default function PlayersPage() {
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function searchPlayers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = query.trim();
    if (name.length < 2) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}&sportIds=1`);
      if (!response.ok) throw new Error("Player search failed");
      const data = (await response.json()) as SearchResponse;
      setPlayers((data.people ?? []).slice(0, 30));
    } catch {
      setPlayers([]);
      setError("We could not search MLB players right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className="eyebrow">Player directory</span>
        <h1>MLB Player Search</h1>
        <p>Find an active MLB player and open a full profile with season statistics and career details.</p>
      </header>

      <form className={styles.search} onSubmit={searchPlayers}>
        <label htmlFor="player-search">Search by player name</label>
        <div>
          <input
            id="player-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Aaron Judge or Shohei Ohtani"
            minLength={2}
          />
          <button type="submit" disabled={loading || query.trim().length < 2}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error ? <p className={styles.notice}>{error}</p> : null}
      {searched && !loading && !error && players.length === 0 ? (
        <p className={styles.notice}>No MLB players matched that search.</p>
      ) : null}

      <section className={styles.grid} aria-live="polite">
        {players.map((player) => (
          <Link className={styles.playerCard} href={`/players/${player.id}`} key={player.id}>
            <img className={styles.headshot} src={headshot(player.id)} alt="" width={96} height={96} />
            <div className={styles.playerInfo}>
              <h2>{player.fullName}</h2>
              <p>{player.primaryPosition?.name ?? "MLB Player"}</p>
              {player.currentTeam ? (
                <span>
                  <img src={teamLogo(player.currentTeam.id)} alt="" width={24} height={24} />
                  {player.currentTeam.name}
                </span>
              ) : (
                <span>Team unavailable</span>
              )}
            </div>
            <span className={styles.arrow}>→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
