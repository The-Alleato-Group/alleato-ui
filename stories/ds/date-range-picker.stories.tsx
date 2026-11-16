import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DateRangePicker } from "@alleato/ui/ds/date-range-picker";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

function Example() {
  const [value, setValue] = useState<DateRange | undefined>({
    from: new Date(2026, 10, 16),
    to: new Date(2026, 10, 20),
  });
  return (
    <DateRangePicker
      value={value}
      onChange={setValue}
      ariaLabel="Inspection window"
    />
  );
}

const meta = {
  title: "Patterns/Date range picker",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
