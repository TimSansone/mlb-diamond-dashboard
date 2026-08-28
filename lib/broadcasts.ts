import type { MlbBroadcast } from "@/types/mlb";

export function tvBroadcastNames(
  broadcasts: MlbBroadcast[] | undefined,
  side: "home" | "away",
): string[] {
  return [...new Set(
    (broadcasts ?? [])
      .filter((broadcast) => broadcast.type?.toUpperCase() === "TV" && broadcast.homeAway === side)
      .map((broadcast) => broadcast.name.trim())
      .filter(Boolean),
  )];
}

export function tvBroadcastLabel(
  broadcasts: MlbBroadcast[] | undefined,
  side: "home" | "away",
): string {
  const names = tvBroadcastNames(broadcasts, side);
  return names.length ? names.join(" · ") : "Not listed";
}
