import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExpandingSearch } from "@alleato/ui/ds/expanding-search";
import { useState } from "react";
import { projects } from "../sample-data";

function Example() {
  const [value, setValue] = useState("");
  return (
    <div className="flex max-w-lg items-center justify-between gap-3 border-b pb-2">
      <p role="status">
        {
          projects.filter((project) =>
            project.name.toLowerCase().includes(value.toLowerCase()),
          ).length
        }{" "}
        matching projects
      </p>
      <ExpandingSearch
        value={value}
        onChange={setValue}
        ariaLabel="Search projects"
        placeholder="Search projects…"
      />
    </div>
  );
}

const meta = {
  title: "Patterns/Expanding search",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
