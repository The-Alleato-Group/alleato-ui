import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  FilterMenu,
  FilterMenuGroup,
  FilterCheckboxRow,
} from "@alleato/ui/ds/filter-menu";
import { useState } from "react";
import { Button } from "@alleato/ui/components/button";

function Example() {
  const [active, setActive] = useState(false);
  return (
    <FilterMenu
      trigger={<Button variant="outline">Filter projects</Button>}
      title="Filter projects"
      hasActiveFilters={active}
      onClear={() => setActive(false)}
    >
      <FilterMenuGroup label="Status">
        <FilterCheckboxRow
          checked={active}
          onCheckedChange={() => setActive(!active)}
        >
          Active
        </FilterCheckboxRow>
      </FilterMenuGroup>
    </FilterMenu>
  );
}

const meta = {
  title: "Patterns/Filter menu",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
