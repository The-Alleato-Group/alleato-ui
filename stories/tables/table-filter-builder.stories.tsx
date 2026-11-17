import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableFilterBuilder } from "@alleato/ui/tables/table-filter-builder";
import { useState } from "react";
import { EMPTY_FILTER_QUERY } from "@alleato/ui/lib/filter-query";
import { statuses } from "../sample-data";

function Example() {
  const [query, setQuery] = useState(EMPTY_FILTER_QUERY);
  return (
    <div className="max-w-xl">
      <TableFilterBuilder
        fields={[
          { id: "name", label: "Project", type: "text" },
          { id: "status", label: "Status", type: "select", options: statuses },
        ]}
        query={query}
        onQueryChange={setQuery}
      />
    </div>
  );
}

const meta = {
  title: "Tables/Table filter builder",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
