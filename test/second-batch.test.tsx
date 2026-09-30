import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { CommentComposer } from "../src/ds/comment-composer";
import { CommentThread } from "../src/ds/comment-thread";
import { DetailField } from "../src/ds/DetailField";
import { RichText } from "../src/ds/rich-text";
import { LocalDateTime, parseLocalDateTime } from "../src/ds/local-date-time";
import { formatPointDate } from "../src/ds/trend-metric-format";
import { formatCurrency } from "../src/lib/format";
import { extractMentionIds, filterMentionCandidates, mentionTokenName } from "../src/lib/mentions";

describe("shared design-system contracts", () => {
  it("keeps date-only values on their calendar day", () => {
    const originalTimezone = process.env.TZ;
    try {
      for (const timezone of ["Asia/Tokyo", "America/New_York"]) {
        process.env.TZ = timezone;
        const date = parseLocalDateTime("2026-09-30");
        expect(date?.getFullYear()).toBe(2026);
        expect(date?.getMonth()).toBe(8);
        expect(date?.getDate()).toBe(30);
        expect(formatPointDate("2026-09-30")).toBe("30 Sep, 2026");
        expect(formatPointDate("2026-09")).toBe("Sep 2026");
        expect(renderToString(<LocalDateTime value="2026-09-30" format="MMM d, yyyy" />))
          .toContain('dateTime="2026-09-30"');
      }
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    }
  });

  it("resolves only known mentions, preferring the longest display name", () => {
    const users = [
      { id: "a", full_name: "Megan Harrison", email: "megan@example.com" },
      { id: "b", full_name: "Megan Harrison Dev", email: "dev@example.com" },
    ];
    expect(extractMentionIds("Ask @Megan Harrison Dev and @Nobody", users)).toEqual(["b"]);
    expect(filterMentionCandidates(users, "dev").map((user) => user.id)).toEqual(["b"]);
  });

  it("never resolves an ambiguous name to the wrong account", () => {
    const users = [
      { id: "a", full_name: "Alex Lee", email: "alex.one@example.com" },
      { id: "b", full_name: "Alex Lee", email: "alex.two@example.com" },
    ];
    expect(extractMentionIds("Ask @Alex Lee", users)).toEqual([]);
    expect(extractMentionIds(`Ask @${mentionTokenName(users[0], users)}`, users)).toEqual(["a"]);
  });

  it("does not notify for a longer unknown mention", () => {
    const users = [{ id: "a", full_name: "Alex Lee", email: "alex@example.com" }];
    expect(extractMentionIds("Ask @Alex Lee-Jones", users)).toEqual([]);
    expect(extractMentionIds("Ask @Alex Lee.Jones", users)).toEqual([]);
    expect(extractMentionIds("Ask @Alex Lee@other", users)).toEqual([]);
    expect(extractMentionIds("Ask @Alex Lee", users)).toEqual(["a"]);
  });

  it("uses Shift+Enter for a newline while suggestions are open", () => {
    function Harness() {
      const [value, setValue] = React.useState("");
      return (
        <CommentComposer
          author={{ name: "Megan Harrison" }}
          users={[{ id: "a", full_name: "Alex Lee", email: "alex@example.com" }]}
          value={value}
          onChange={setValue}
          onSubmit={() => undefined}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole("combobox") as HTMLTextAreaElement;
    fireEvent.click(screen.getByRole("button", { name: "Mention someone" }));
    expect(screen.getByRole("listbox", { name: "Mention suggestions" })).toBeTruthy();
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(input.value).toBe("@");
  });

  it("renders rich text without executing imported markup", () => {
    render(<RichText value="<strong>Safe</strong><script>alert(1)</script>" />);
    expect(screen.getByText("Safe").tagName).toBe("STRONG");
    expect(screen.queryByText("alert(1)")).toBeNull();
    expect(document.querySelector("script")).toBeNull();
  });

  it("keeps a comment thread usable when it has no history", () => {
    render(<CommentThread count={0} composer={<button>Post comment</button>} />);
    expect(screen.getByRole("button", { name: "Post comment" })).toBeTruthy();
    expect(screen.getByText("No comments yet")).toBeTruthy();
  });

  it("takes author identity from its consumer", () => {
    render(
      <CommentComposer
        author={{ name: "Megan Harrison" }}
        users={[]}
        value=""
        onChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );
    expect(screen.getByText("Megan Harrison")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Post comment" }).hasAttribute("disabled")).toBe(true);
  });

  it("opens mention suggestions from the composer toolbar", () => {
    vi.stubGlobal("requestAnimationFrame", () => 1);
    function Harness() {
      const [value, setValue] = React.useState("");
      return (
        <CommentComposer
          author={{ name: "Megan Harrison" }}
          users={[{ id: "a", full_name: "Alex Lee", email: "alex@example.com" }]}
          value={value}
          onChange={setValue}
          onSubmit={() => undefined}
        />
      );
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Mention someone" }));
    expect(screen.getByRole("listbox", { name: "Mention suggestions" })).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole("option", { name: /Alex Lee/ }));
    expect(screen.getByRole("combobox")).toHaveProperty("value", "@Alex Lee ");
    vi.unstubAllGlobals();
  });

  it("keeps a real zero and suppresses an unanswered detail field", () => {
    render(
      <div>
        <DetailField label="Budget" value={0} currency />
        <DetailField label="Unanswered" value="N/A" />
      </div>,
    );
    expect(screen.getByText("$0.00")).toBeTruthy();
    expect(screen.queryByText("Unanswered")).toBeNull();
    expect(formatCurrency(-0.001)).toBe("$0.00");
  });
});
