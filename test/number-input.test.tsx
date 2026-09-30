import { render, screen } from "@testing-library/react";
import { NumberInput } from "../src/components/number-input";

describe("NumberInput placeholder", () => {
  it("renders no placeholder when the caller passes none", () => {
    render(<NumberInput aria-label="Days" />);
    expect(screen.getByLabelText("Days").hasAttribute("placeholder")).toBe(false);
  });

  it("renders the caller's placeholder", () => {
    render(<NumberInput aria-label="Days" placeholder="e.g. 2" />);
    expect(screen.getByLabelText("Days").getAttribute("placeholder")).toBe("e.g. 2");
  });
});
