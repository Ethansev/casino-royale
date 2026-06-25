"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_MESSAGE_LENGTH,
} from "@/lib/profanity";
import { roomLabel, type ChatMessage } from "@/lib/chatRooms";

const GLASS =
  "border border-[var(--mr-border)] bg-[var(--mr-surface)] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md";

/** Floating lobby/table chat. Backend-only: renders nothing in the no-backend
 *  public demo (the SSE stream 404s and we hide). Uses fetch/EventSource only —
 *  no auth/db imports — so it's safe to sync to the public repo. */
export function ChatPanel({ room }: { room: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Identity probe — drives whether the composer is enabled. Re-checked when the
  // panel is opened and on window focus, since sign-in can happen (via the
  // lobby dialog) after this component already mounted.
  useEffect(() => {
    let cancelled = false;
    const probe = () => {
      fetch("/api/auth/get-session", { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled) setSignedIn(Boolean(data?.user));
        })
        .catch(() => {});
    };
    probe();
    window.addEventListener("focus", probe);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", probe);
    };
  }, [open]);

  // SSE subscription. onopen ⇒ backend present; error-before-open ⇒ hide.
  useEffect(() => {
    setMessages([]);
    const es = new EventSource(`/api/chat/stream?room=${encodeURIComponent(room)}`);
    let opened = false;

    es.addEventListener("open", () => {
      opened = true;
      setAvailable(true);
    });
    es.addEventListener("init", (e) => {
      const incoming: ChatMessage[] = JSON.parse(e.data);
      setMessages(incoming);
    });
    es.addEventListener("message", (e) => {
      const msg: ChatMessage = JSON.parse(e.data);
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    });
    es.addEventListener("error", () => {
      // Never connected → no backend (public demo): give up and hide.
      if (!opened) {
        setAvailable(false);
        es.close();
      }
    });

    return () => es.close();
  }, [room]);

  // Keep the latest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  if (available === false) return null;

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    setNotice(null);
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ room, body }),
    }).catch(() => null);
    if (!res) return;
    if (res.status === 401) {
      setSignedIn(false);
      setNotice("Sign in to chat.");
      return;
    }
    if (res.status === 429) {
      setNotice("You're sending messages too fast.");
      return;
    }
    if (!res.ok) {
      setNotice("Message couldn't be sent.");
      return;
    }
    const data = await res.json().catch(() => null);
    if (data?.message) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message],
      );
    }
  };

  const report = async (id: string) => {
    await fetch("/api/chat/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ messageId: id }),
    }).catch(() => {});
    setNotice("Thanks — reported for review.");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition hover:brightness-110 ${GLASS}`}
        style={{ color: "var(--mr-accent)" }}
        aria-label="Open chat"
      >
        💬 Chat
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 flex h-[26rem] w-[20rem] flex-col rounded-2xl ${GLASS}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--mr-border)] px-3 py-2">
        <span className="font-marquee text-sm font-bold">
          {roomLabel(room)} chat
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-[color:var(--mr-dim)] transition hover:text-[color:var(--mr-accent)]"
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {messages.length === 0 ? (
          <p className="pt-4 text-center text-xs" style={{ color: "var(--mr-dim)" }}>
            No messages yet — say hi.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="group text-sm leading-snug">
              <span
                className="font-semibold"
                style={{ color: m.mine ? "var(--mr-accent)" : "var(--mr-text)" }}
              >
                {m.name}
              </span>
              <span style={{ color: "var(--mr-dim)" }}>: </span>
              <span style={{ color: "var(--mr-text)" }}>{m.body}</span>
              {!m.mine && (
                <button
                  onClick={() => report(m.id)}
                  className="ml-1.5 align-middle text-[10px] opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
                  style={{ color: "var(--mr-dim)" }}
                  aria-label="Report message"
                  title="Report"
                >
                  ⚐
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {notice && (
        <p className="px-3 pb-1 text-[11px]" style={{ color: "var(--mr-dim)" }}>
          {notice}
        </p>
      )}

      <div className="border-t border-[var(--mr-border)] p-2">
        {signedIn ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Message…"
              className="min-w-0 flex-1 rounded-lg border border-[var(--mr-border)] bg-black/30 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--mr-accent)]"
            />
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-bold transition hover:brightness-110 disabled:opacity-50"
              style={{ background: "var(--mr-accent)", color: "var(--mr-accent-text)" }}
              disabled={!text.trim()}
            >
              Send
            </button>
          </form>
        ) : (
          <p className="py-1 text-center text-xs" style={{ color: "var(--mr-dim)" }}>
            Sign in to chat.
          </p>
        )}
      </div>
    </div>
  );
}
