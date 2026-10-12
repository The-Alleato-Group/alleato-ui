import * as React from "react";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../src/ds/status-badge";

describe("shared estimate review status", () => {
  it.each(["pending_review", "pending-review", "Pending Review"])(
    "keeps %s visibly awaiting review instead of neutral",
    (status) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText("Pending Review").getAttribute("data-status-variant"))
        .toBe("warning");
    },
  );

  it.each([
    ["draft", "Draft", "neutral"],
    ["approved", "Approved", "success"],
    ["rejected", "Rejected", "error"],
  ])("retains the distinct %s lifecycle state", (status, label, variant) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label).getAttribute("data-status-variant")).toBe(variant);
  });
});
