import { act, fireEvent, render, screen } from "@testing-library/react";
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

describe("NumberInput select-on-focus", () => {
  // Hold the deferred select so the test decides when the next frame runs.
  function holdFrames() {
    const frames: FrameRequestCallback[] = [];
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    const caf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      frames[id - 1] = () => undefined;
    });
    return {
      flush: () => frames.splice(0).forEach((cb) => cb(0)),
      restore: () => { raf.mockRestore(); caf.mockRestore(); },
    };
  }

  // Types one key the way a browser does: replace the current selection, then fire input.
  function typeKey(input: HTMLInputElement, key: string) {
    fireEvent.keyDown(input, { key });
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const next = input.value.slice(0, start) + key + input.value.slice(end);
    fireEvent.change(input, { target: { value: next } });
    input.setSelectionRange(start + 1, start + 1);
  }

  it.each([
    ["7.5", "7.5"],
    ["12.5", "12.5"],
  ])("keeps every digit when %s is typed before the select frame runs", (typed, expected) => {
    const frames = holdFrames();
    const values: string[] = [];
    render(<NumberInput aria-label="Retainage" value={0} onChange={(e) => values.push(e.target.value)} />);
    const input = screen.getByLabelText("Retainage") as HTMLInputElement;
    act(() => { input.focus(); });
    for (const [i, key] of [...typed].entries()) {
      act(() => { typeKey(input, key); });
      if (i === 0) act(() => frames.flush()); // the late frame lands after the first key
    }
    frames.restore();
    expect(input.value).toBe(expected);
    expect(values.at(-1)).toBe(expected);
  });

  it("keeps the deferred select when a non-editing key arrives first", () => {
    const frames = holdFrames();
    render(<NumberInput aria-label="Retainage" value={10} onChange={() => undefined} />);
    const input = screen.getByLabelText("Retainage") as HTMLInputElement;
    act(() => { input.focus(); });
    input.setSelectionRange(1, 1); // mouseup collapsed the selection
    fireEvent.keyDown(input, { key: "Shift" });
    act(() => frames.flush());
    frames.restore();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
  });

  it("still selects the existing value when nothing is typed", () => {
    const frames = holdFrames();
    render(<NumberInput aria-label="Retainage" value={10} onChange={() => undefined} />);
    const input = screen.getByLabelText("Retainage") as HTMLInputElement;
    act(() => { input.focus(); });
    act(() => frames.flush());
    frames.restore();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, input.value.length]);
  });
});
