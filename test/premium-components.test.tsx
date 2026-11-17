import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { SegmentedControl } from "../src/ds/segmented-control";
import { SelectionCard } from "../src/ds/selection-card";
import { QuantityStepper } from "../src/ds/quantity-stepper";
import { FavoriteButton } from "../src/ds/favorite-button";
import { MediaCard } from "../src/ds/media-card";

afterEach(cleanup);

describe("premium controlled components", () => {
  it("updates the semantic single selection and skips unavailable options", () => {
    function Example() {
      const [value, setValue] = useState("all");
      return (
        <SegmentedControl
          label="Space type"
          options={[
            { value: "all", label: "All spaces" },
            { value: "home", label: "Homes" },
            { value: "later", label: "Later", disabled: true },
          ]}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    render(<Example />);
    fireEvent.click(screen.getByRole("radio", { name: "Homes" }));
    expect(
      screen.getByRole("radio", { name: "Homes" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen
        .getByRole("radio", { name: "All spaces" })
        .getAttribute("aria-checked"),
    ).toBe("false");
    expect(
      (screen.getByRole("radio", { name: "Later" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("keeps card and favorite state controlled and never submits the host form", () => {
    const cardChange = vi.fn();
    const favoriteChange = vi.fn();
    const submit = vi.fn();
    render(
      <form onSubmit={submit}>
        <SelectionCard
          label="Garden"
          description="Outside space"
          selected
          onSelectedChange={cardChange}
        />
        <FavoriteButton
          label="Save garden"
          pressed={false}
          onPressedChange={favoriteChange}
        />
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Garden Outside/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save garden" }));
    expect(cardChange).toHaveBeenCalledWith(false);
    expect(favoriteChange).toHaveBeenCalledWith(true);
    expect(
      screen
        .getByRole("button", { name: "Save garden" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
    expect(submit).not.toHaveBeenCalled();
  });

  it("bounds quantity changes and disables each endpoint", () => {
    function Example() {
      const [value, setValue] = useState(1);
      return (
        <QuantityStepper
          label="Guests"
          min={1}
          max={2}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    render(<Example />);
    expect(
      (
        screen.getByRole("button", {
          name: "Decrease Guests",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Increase Guests" }));
    expect(screen.getByRole("status", { name: "Guests" }).textContent).toBe(
      "2",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Increase Guests",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Decrease Guests" }));
    expect(screen.getByRole("status", { name: "Guests" }).textContent).toBe(
      "1",
    );
  });

  it("keeps favorite separate from the card link and recovers a changed image source", () => {
    const card = (src: string) => (
      <MediaCard
        title="Cabin"
        href="/cabin"
        image={{ src, alt: "A cabin in the woods" }}
        action={
          <FavoriteButton
            label="Save cabin"
            pressed={false}
            onPressedChange={() => {}}
          />
        }
      />
    );
    const { rerender } = render(card("/missing.jpg"));
    expect(
      screen
        .getByRole("link")
        .contains(screen.getByRole("button", { name: "Save cabin" })),
    ).toBe(false);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      "A cabin in the woods",
    );
    rerender(card("/new.jpg"));
    expect(screen.getByRole("img").getAttribute("src")).toBe("/new.jpg");
  });
});
