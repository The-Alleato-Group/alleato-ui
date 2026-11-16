import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Calendar } from "@alleato/ui/components/calendar";
import { useState } from "react";
function Example() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 10, 16));
  return (
    <Calendar
      mode="single"
      defaultMonth={new Date(2026, 10)}
      onSelect={setDate}
      selected={date}
    />
  );
}

const meta = {
  title: "Components/Calendar",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
