/**
 * Mention helpers shared by every comment composer.
 *
 * Mentions are plain text (`@Megan Harrison`) matched back to user ids at
 * submit time, so the body stays readable everywhere it is shown and the
 * server receives explicit ids to validate. A name that matches nobody is
 * just text.
 */

export type MentionableUser = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export function mentionDisplayName(user: MentionableUser): string {
  return user.full_name || user.email?.split("@")[0] || "Unknown";
}

/** The visible mention token must identify one person even when names collide. */
export function mentionTokenName(
  user: MentionableUser,
  users: readonly MentionableUser[],
): string {
  const name = mentionDisplayName(user);
  const sameName = users.filter(
    (candidate) => mentionDisplayName(candidate).toLowerCase() === name.toLowerCase(),
  );
  if (sameName.length < 2) return name;
  const email = user.email?.trim();
  if (
    email &&
    sameName.filter((candidate) => candidate.email?.trim().toLowerCase() === email.toLowerCase()).length === 1
  ) {
    return `${name} (${email})`;
  }
  return `${name} [${user.id}]`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mentionPattern(names: readonly string[]): RegExp {
  // Longest name first: `@Megan Harrison (dev)` must resolve to that one user,
  // never also to `Megan Harrison`. A per-user prefix test did exactly that on
  // 2026-09-16 and notified two accounts for one mention.
  const ordered = [...names].sort((a, b) => b.length - a.length);
  // A final period is sentence punctuation, but a period followed by a word
  // character continues an unknown mention (e.g. @Alex Lee.Jones).
  return new RegExp(`@(${ordered.map(escapeRegExp).join("|")})(?![\\w@-]|\\.[\\w])`, "gi");
}

/** Ids of every user whose display name appears as `@Name` in the text. */
export function extractMentionIds(
  text: string,
  users: readonly MentionableUser[],
): string[] {
  const byName = new Map<string, string>();
  for (const user of users) {
    const name = mentionDisplayName(user);
    if (name === "Unknown") continue;
    byName.set(mentionTokenName(user, users).toLowerCase(), user.id);
  }
  if (byName.size === 0) return [];
  const ids = new Set<string>();
  for (const match of text.matchAll(mentionPattern([...byName.keys()]))) {
    const id = byName.get(match[1]!.toLowerCase());
    if (id) ids.add(id);
  }
  return users.map((user) => user.id).filter((id) => ids.has(id));
}

/**
 * Split a comment body into text and mention segments for rendering. Only
 * names of known users become mention segments; a stray `@` stays text.
 */
export function splitMentions(
  text: string,
  users: readonly MentionableUser[],
): Array<{ type: "text" | "mention"; value: string }> {
  const names = users
    .filter((user) => mentionDisplayName(user) !== "Unknown")
    .map((user) => mentionTokenName(user, users));
  if (names.length === 0) return [{ type: "text", value: text }];
  const pattern = mentionPattern(names);
  const segments: Array<{ type: "text" | "mention"; value: string }> = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ type: "text", value: text.slice(last, start) });
    segments.push({ type: "mention", value: match[0] });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}

export function filterMentionCandidates(
  users: readonly MentionableUser[],
  query: string,
): MentionableUser[] {
  const needle = query.trim().toLowerCase();
  const mentionable = users.filter((user) => mentionDisplayName(user) !== "Unknown");
  if (!needle) return mentionable;
  return mentionable.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(needle) ||
      user.email?.toLowerCase().includes(needle),
  );
}
