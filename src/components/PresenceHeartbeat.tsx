"use client";

import { useEffect } from "react";

const ANON_KEY = "cl-anon-id";

function anonId(): string {
  let id = window.localStorage.getItem(ANON_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

/** Posts a presence heartbeat for the current game every ~15s. Backend-optional:
 *  if /api/presence isn't there (public demo), the fetch just no-ops. */
export function PresenceHeartbeat({ game }: { game: string }) {
  useEffect(() => {
    const beat = () => {
      void fetch("/api/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game, anonId: anonId() }),
      }).catch(() => {});
    };
    beat();
    const t = setInterval(beat, 15_000);
    return () => clearInterval(t);
  }, [game]);

  return null;
}
