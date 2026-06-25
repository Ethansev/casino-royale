export const MAX_MESSAGE_LENGTH = 280;

// A deliberately small starter list — masks the most common slurs/profanity.
// Not exhaustive; the report path + future moderation cover the long tail.
const BANNED = [
  "fuck",
  "shit",
  "bitch",
  "cunt",
  "asshole",
  "dick",
  "piss",
  "bastard",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "retard",
];

const PATTERN = new RegExp(`\\b(${BANNED.join("|")})\\b`, "gi");

/** Mask banned words with asterisks (keeps message length/shape). */
export function maskProfanity(text: string): string {
  return text.replace(PATTERN, (m) => "*".repeat(m.length));
}

/** Normalize an incoming message: trim, collapse whitespace, cap length, mask.
 *  Returns null if there's nothing left to send. */
export function sanitizeMessage(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  return maskProfanity(collapsed.slice(0, MAX_MESSAGE_LENGTH));
}
