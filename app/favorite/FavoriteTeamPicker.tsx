"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TeamOption = { id: number; name: string };

export default function FavoriteTeamPicker({
  teams,
  selectedTeamId,
}: {
  teams: TeamOption[];
  selectedTeamId?: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(selectedTeamId ? String(selectedTeamId) : "");

  useEffect(() => {
    if (selectedTeamId) {
      localStorage.setItem("mlb-favorite-team", String(selectedTeamId));
      return;
    }

    const saved = localStorage.getItem("mlb-favorite-team");
    if (saved && teams.some((team) => String(team.id) === saved)) {
      setValue(saved);
      router.replace(`/favorite?team=${saved}`);
    }
  }, [router, selectedTeamId, teams]);

  function chooseTeam(teamId: string) {
    setValue(teamId);
    if (!teamId) {
      localStorage.removeItem("mlb-favorite-team");
      router.push("/favorite");
      return;
    }

    localStorage.setItem("mlb-favorite-team", teamId);
    router.push(`/favorite?team=${teamId}`);
  }

  return (
    <label className="favoritePicker">
      <span>Favorite team</span>
      <select value={value} onChange={(event) => chooseTeam(event.target.value)}>
        <option value="">Choose an MLB team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>
    </label>
  );
}
