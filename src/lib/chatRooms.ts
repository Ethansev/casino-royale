import { GAMES } from "@/components/lobby/games";

/** Message shape sent to clients (no raw user ids — `mine` is viewer-relative). */
export interface ChatMessage {
  id: string;
  room: string;
  name: string;
  body: string;
  ts: number;
  mine: boolean;
}

export const LOBBY_ROOM = "lobby";

/** Per-game room id, e.g. "table:craps". */
export function tableRoom(gameId: string): string {
  return `table:${gameId}`;
}

const TABLE_ROOMS: readonly string[] = GAMES.map((g) => tableRoom(g.id));

/** Only the lobby and known per-game tables are valid rooms. */
export function isValidRoom(room: string): boolean {
  return room === LOBBY_ROOM || TABLE_ROOMS.includes(room);
}

/** Table rooms for games that are currently playable. */
export function liveTableRooms(): string[] {
  return GAMES.filter((g) => g.live).map((g) => tableRoom(g.id));
}

/** Human label for a room id. */
export function roomLabel(room: string): string {
  if (room === LOBBY_ROOM) return "Lobby";
  const id = room.startsWith("table:") ? room.slice("table:".length) : room;
  return GAMES.find((g) => g.id === id)?.title ?? id;
}

/** Short label for a room tab ("Global" for the lobby; trimmed game title). */
export function roomTabLabel(room: string): string {
  if (room === LOBBY_ROOM) return "Global";
  const id = room.startsWith("table:") ? room.slice("table:".length) : room;
  const title = GAMES.find((g) => g.id === id)?.title ?? id;
  return title.replace(/ Craps$/, "");
}
