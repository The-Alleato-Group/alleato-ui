import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableToolbar, type ViewMode } from "@alleato/ui/tables/table-toolbar";
import { useState } from "react";
import { projects } from "../sample-data";
import { StoryTableHost } from "./story-table-host";

function Example() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("table");
  const [visibleColumns, setVisibleColumns] = useState(["name", "status"]);
  return (
    <StoryTableHost>
      <TableToolbar
        totalItems={3}
        filteredItems={
          projects.filter((project) =>
            project.name.toLowerCase().includes(search.toLowerCase()),
          ).length
        }
        selectedCount={0}
        searchValue={search}
        onSearchChange={setSearch}
        currentView={view}
        onViewChange={setView}
        enabledViews={["table", "split"]}
        activeFilters={{}}
        onFilterChange={() => {}}
        onClearFilters={() => {}}
        columns={[
          { id: "name", label: "Project" },
          { id: "status", label: "Status" },
        ]}
        visibleColumns={visibleColumns}
        onColumnVisibilityChange={setVisibleColumns}
      />
      <p role="status" className="mt-2">
        View: {view} · Visible columns: {visibleColumns.join(", ")}
      </p>
    </StoryTableHost>
  );
}

const meta = {
  title: "Tables/Table toolbar",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
