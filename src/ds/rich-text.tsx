import * as React from "react";

import { cn } from "../lib/utils";
import {
  containsTags,
  decodeHtmlEntities,
  parseRichText,
  type RichTextNode,
} from "../lib/rich-text";
import { SubsectionHeading } from "../layout/headings";

export interface RichTextProps {
  /** Value as stored — plain text, or the HTML subset `RichTextField` writes. */
  value: string | null | undefined;
  /** Rendered when the value is empty. Defaults to rendering nothing. */
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Render a value authored by `RichTextField`.
 *
 * Any field edited through `RichTextField` MUST be displayed with this
 * component. Rendering such a value directly (`{record.description}`) shows the
 * stored markup literally — the bug this component exists to prevent.
 *
 * Plain-text values render verbatim with `whitespace-pre-wrap`, so fields that
 * never went through the rich text editor look exactly as they always have.
 *
 * Formatting is emitted as React elements, never `dangerouslySetInnerHTML`, so
 * imported or legacy markup cannot introduce script, links, or styling.
 */
export function RichText({ value, fallback = null, className }: RichTextProps) {
  const trimmed = typeof value === "string" ? value.trim() : "";

  if (!trimmed) return <>{fallback}</>;

  // Entity-only text ("Impact&nbsp;Fire") is plain text with escaped
  // characters: decode it and keep its line breaks. Only tags need the parser.
  if (!containsTags(trimmed)) {
    return (
      <div className={cn("whitespace-pre-wrap text-sm leading-7", className)}>
        {decodeHtmlEntities(trimmed)}
      </div>
    );
  }

  const nodes = parseRichText(trimmed);

  if (nodes.length === 0) return <>{fallback}</>;

  return (
    <div className={cn("text-sm leading-7", className)}>
      {renderNodes(nodes)}
    </div>
  );
}

/** Render a node tree. Exported for readers that build the tree themselves. */
export function renderRichTextNodes(nodes: RichTextNode[]): React.ReactNode {
  return nodes.map((node, index) => renderNode(node, index));
}

const renderNodes = renderRichTextNodes;

function renderNode(node: RichTextNode, key: React.Key): React.ReactNode {
  if (node.kind === "text") return <React.Fragment key={key}>{node.text}</React.Fragment>;
  if (node.kind === "break") return <br key={key} />;

  const children = renderNodes(node.children);

  switch (node.tag) {
    case "strong":
      return <strong key={key} className="font-semibold">{children}</strong>;
    case "em":
      return <em key={key}>{children}</em>;
    case "u":
      return <u key={key}>{children}</u>;
    case "ul":
      return <ul key={key} className="list-disc space-y-1 pl-5">{children}</ul>;
    case "ol":
      return <ol key={key} className="list-decimal space-y-1 pl-5">{children}</ol>;
    case "li":
      return <li key={key}>{children}</li>;
    case "heading":
      // Level 3 in the page ladder: a section inside a field, never a page
      // or section heading (DESIGN.md section 3).
      return (
        <SubsectionHeading key={key} as="h3" className="mt-5 first:mt-0">
          {children}
        </SubsectionHeading>
      );
    case "subheading":
      return (
        <SubsectionHeading key={key} as="h4" className="mt-4 text-muted-foreground">
          {children}
        </SubsectionHeading>
      );
    case "block":
    default:
      // An empty block is the editor's representation of a blank line.
      return node.children.length === 0 ? (
        <div key={key} className="h-3" aria-hidden />
      ) : (
        <div key={key}>{children}</div>
      );
  }
}
