/**
 * Title Case for headings the product authors: every word capitalised except
 * the short function words inside the phrase (owner, 2026-09-23: "every word is
 * capitalized other than pronouns like of and the ... the heading
 * capitalization should be a global change"). Applied by the heading
 * components to string titles only; record titles and extracted text are user
 * content and are never transformed.
 */

// Articles, conjunctions and the short prepositions. Longer prepositions
// (over, with, from, into) are capitalised: "Events Over Time".
const SMALL_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "of", "on", "in", "at", "to", "by",
  "for", "as", "vs", "up",
]);

function capitalizeWord(word: string): string {
  // Leave words that already carry capitals alone (RFI, PCO, iPhone, AI).
  if (/[A-Z]/.test(word.slice(1))) return word;
  return word
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join("-");
}

export function titleCase(value: string): string {
  const words = value.split(/(\s+)/);
  const wordIndexes = words.map((word, index) => (index % 2 === 0 && word ? index : -1)).filter((index) => index >= 0);
  const first = wordIndexes[0];
  const last = wordIndexes[wordIndexes.length - 1];
  return words
    .map((word, index) => {
      if (index % 2 === 1 || !word) return word;
      const bare = word.replace(/[^A-Za-z0-9'’-]/g, "").toLowerCase();
      if (index !== first && index !== last && SMALL_WORDS.has(bare)) return word.toLowerCase();
      return capitalizeWord(word);
    })
    .join("");
}
