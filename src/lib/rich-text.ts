/**
 * Rich text parsing for values authored by `RichTextField`.
 *
 * `RichTextField` (contentEditable) stores a small HTML subset — b/strong, i/em,
 * u, ul, ol, li, p, div, br with every attribute stripped. Readers that render
 * such a value as a React text node show the markup literally, which is what
 * this module exists to prevent.
 *
 * The parser produces a node tree instead of an HTML string so consumers can
 * render React elements. Nothing here feeds `dangerouslySetInnerHTML`, so an
 * unexpected tag or attribute in legacy/imported data cannot become executable
 * markup: unknown tags are unwrapped, their text is escaped by React, and the
 * tags that can carry script or styling payloads are dropped with their
 * contents.
 */

export type RichTextTag =
  | "strong"
  | "em"
  | "u"
  | "ul"
  | "ol"
  | "li"
  | "block"
  // Section headings: produced by `structurePlainText` for numbered section
  // headers, and by the parser for h1-h4 in imported markup.
  | "heading"
  | "subheading";

export type RichTextNode =
  | { kind: "text"; text: string }
  | { kind: "break" }
  | { kind: "element"; tag: RichTextTag; children: RichTextNode[] };

/** Source tag -> the tag we render. Anything absent is unwrapped. */
const TAG_MAP: Record<string, RichTextTag> = {
  h1: "heading",
  h2: "heading",
  h3: "subheading",
  h4: "subheading",
  b: "strong",
  strong: "strong",
  i: "em",
  em: "em",
  u: "u",
  ul: "ul",
  ol: "ol",
  li: "li",
  p: "block",
  div: "block",
};

/** Tags whose *contents* are discarded, not unwrapped. */
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "head",
  "title",
  "noscript",
  "iframe",
  "object",
  "embed",
  "template",
]);

/** Void tags that never carry children. */
const VOID_TAGS = new Set([
  "br",
  "hr",
  "img",
  "input",
  "meta",
  "link",
  "source",
  "col",
  "area",
  "base",
  "wbr",
]);

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  // Word/Outlook paste artifacts, not intentional non-breaking spaces:
  // U+00A0 would block wrapping in a narrow column and compares unequal to " ".
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  bull: "•",
  deg: "°",
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(
    /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g,
    (match, entity: string) => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        const code = Number.parseInt(entity.slice(2), 16);
        return Number.isFinite(code) ? safeFromCodePoint(code, match) : match;
      }
      if (entity.startsWith("#")) {
        const code = Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? safeFromCodePoint(code, match) : match;
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    },
  );
}

function safeFromCodePoint(code: number, fallback: string): string {
  if (code <= 0 || code > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback;
  }
}

const TAG_PATTERN = /<[a-zA-Z/!][^>]*>/;
const ENTITY_PATTERN = /&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/;

/**
 * True when the value carries markup this module needs to interpret — tags or
 * entities. Plain text — the overwhelming majority of stored descriptions —
 * returns false so callers can keep rendering it verbatim.
 *
 * A reader deciding *how* to render should use `containsTags` instead: an
 * entity-only value ("Schematic Design &amp; Layout", six of them in the
 * PDF-imported PC-8344-0001 scope) is plain text with escaped characters, and
 * sending it through the tag parser produced one text node with every line
 * break collapsed (2026-09-21). Decode it with `decodeHtmlEntities` and keep
 * its structure.
 */
export function containsMarkup(value: string | null | undefined): boolean {
  if (!value) return false;
  return TAG_PATTERN.test(value) || ENTITY_PATTERN.test(value);
}

/** True only when the value has tags; entities alone do not make it markup. */
export function containsTags(value: string | null | undefined): boolean {
  if (!value) return false;
  return TAG_PATTERN.test(value);
}

type Token =
  | { type: "text"; value: string }
  | { type: "open"; name: string; selfClosing: boolean }
  | { type: "close"; name: string };

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  // Comments and doctype/processing instructions carry no renderable content.
  const source = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<![^>]*>/g, "");
  const tagPattern = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: source.slice(lastIndex, match.index) });
    }
    const [, closing, rawName, , selfClose] = match;
    const name = rawName.toLowerCase();
    if (closing) {
      tokens.push({ type: "close", name });
    } else {
      tokens.push({
        type: "open",
        name,
        selfClosing: Boolean(selfClose) || VOID_TAGS.has(name),
      });
    }
    lastIndex = tagPattern.lastIndex;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: "text", value: source.slice(lastIndex) });
  }

  return tokens;
}

/**
 * Parse the `RichTextField` HTML subset into a node tree.
 *
 * Unbalanced markup is tolerated: a stray close tag with no matching open is
 * ignored, and anything still open at the end is closed implicitly. Imported
 * descriptions are frequently malformed, and losing the text would be worse
 * than losing the formatting.
 */
export function parseRichText(value: string | null | undefined): RichTextNode[] {
  if (!value) return [];

  const root: RichTextNode[] = [];
  // Each frame owns the children list it appends to, plus the source tag name
  // so a close tag can find the frame it belongs to.
  const stack: Array<{ name: string; children: RichTextNode[] }> = [
    { name: "", children: root },
  ];
  let dropDepth = 0;

  const current = () => stack[stack.length - 1].children;

  for (const token of tokenize(value)) {
    if (token.type === "text") {
      if (dropDepth > 0) continue;
      const text = decodeHtmlEntities(token.value);
      if (text) current().push({ kind: "text", text });
      continue;
    }

    if (token.type === "open") {
      if (dropDepth > 0) {
        if (!token.selfClosing && DROP_WITH_CONTENT.has(token.name)) dropDepth += 1;
        continue;
      }
      if (DROP_WITH_CONTENT.has(token.name)) {
        if (!token.selfClosing) dropDepth = 1;
        continue;
      }
      if (token.name === "br") {
        current().push({ kind: "break" });
        continue;
      }
      if (token.selfClosing) continue;

      const tag = TAG_MAP[token.name];
      if (!tag) {
        // Unknown tag: keep the text, drop the wrapper.
        stack.push({ name: token.name, children: current() });
        continue;
      }
      const element: RichTextNode = { kind: "element", tag, children: [] };
      current().push(element);
      stack.push({ name: token.name, children: element.children });
      continue;
    }

    // close
    if (dropDepth > 0) {
      if (DROP_WITH_CONTENT.has(token.name)) dropDepth -= 1;
      continue;
    }
    const frameIndex = findOpenFrame(stack, token.name);
    if (frameIndex > 0) stack.length = frameIndex;
  }

  return collapse(root);
}

function findOpenFrame(
  stack: Array<{ name: string }>,
  name: string,
): number {
  for (let i = stack.length - 1; i > 0; i -= 1) {
    if (stack[i].name === name) return i;
  }
  return -1;
}

/**
 * Drop nodes that would render as empty space. Editors emit a great many
 * whitespace-only text nodes between block tags; keeping them adds blank
 * paragraphs the author never typed.
 */
function collapse(nodes: RichTextNode[]): RichTextNode[] {
  const out: RichTextNode[] = [];
  for (const node of nodes) {
    if (node.kind === "text") {
      if (!node.text.trim()) continue;
      out.push(node);
      continue;
    }
    if (node.kind === "break") {
      out.push(node);
      continue;
    }
    const children = collapse(node.children);
    if (children.length === 0 && node.tag !== "block") continue;
    out.push({ kind: "element", tag: node.tag, children });
  }
  return out;
}

/**
 * Flatten rich text to plain text, preserving block boundaries as newlines.
 *
 * Use this wherever the destination cannot show formatting — CSV/PDF export,
 * list snippets, plain-textarea edit surfaces, AI prompts. Prefer `<RichText>`
 * for anything the user reads on screen.
 */
export function richTextToPlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!containsTags(value)) return decodeHtmlEntities(value).trim();

  // Accumulate into lines rather than pushing separators around each block:
  // emitting "\n" on both sides of a block doubles every gap between adjacent
  // blocks, which turned a plain two-line list into a double-spaced one.
  const lines: string[] = [];
  let current = "";

  const flush = () => {
    lines.push(current.trim());
    current = "";
  };

  const walk = (nodes: RichTextNode[]) => {
    for (const node of nodes) {
      if (node.kind === "text") {
        current += node.text;
        continue;
      }
      if (node.kind === "break") {
        flush();
        continue;
      }
      if (
        node.tag === "block" ||
        node.tag === "li" ||
        node.tag === "heading" ||
        node.tag === "subheading"
      ) {
        if (current.trim()) flush();
        walk(node.children);
        if (current.trim()) flush();
        else if (node.children.length === 0) lines.push("");
        continue;
      }
      walk(node.children);
    }
  };

  walk(parseRichText(value));
  if (current.trim()) flush();

  return lines
    .join("\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
