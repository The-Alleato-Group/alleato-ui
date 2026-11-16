import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { StatusBadge } from "@alleato/ui/ds/status-badge";
import { Text } from "@alleato/ui/ds/text";
import {
  UnifiedTablePage,
  type TableColumn,
} from "@alleato/ui/tables/unified-table-page";
import { projects, type Project } from "../sample-data";
import { StoryTableHost } from "./story-table-host";

function ProjectTable({
  empty = false,
  loading = false,
}: {
  empty?: boolean;
  loading?: boolean;
}) {
  const [rows, setRows] = useState(empty ? [] : projects);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [opened, setOpened] = useState<string | null>(null);
  const columns: TableColumn<Project>[] = [
    {
      id: "name",
      label: "Project",
      render: (row) => row.name,
      sortValue: (row) => row.name,
      filterValue: (row) => row.name,
      sortable: true,
      editable: true,
      editValue: (row) => row.name,
      onEdit: (row, value) =>
        setRows((current) =>
          current.map((item) =>
            item.id === row.id ? { ...item, name: String(value) } : item,
          ),
        ),
    },
    {
      id: "owner",
      label: "Owner",
      render: (row) => row.owner,
      sortValue: (row) => row.owner,
      filterValue: (row) => row.owner,
      sortable: true,
    },
    {
      id: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
      filterValue: (row) => row.status,
    },
  ];
  return (
    <StoryTableHost>
      <UnifiedTablePage<Project>
        header={{
          title: "Project records",
          description:
            "Track the coordinator and status for each active project.",
        }}
        toolbar={{
          totalItems: rows.length,
          filteredItems: rows.length,
          searchValue: search,
          onSearchChange: setSearch,
          excludedViews: ["board", "card"],
          filters: [
            {
              id: "status",
              label: "Status",
              type: "select",
              options: [
                { value: "Active", label: "Active" },
                { value: "Planned", label: "Planned" },
              ],
            },
          ],
        }}
        data={{
          items: rows.filter((row) =>
            `${row.name} ${row.owner}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          ),
          isLoading: loading,
        }}
        table={{
          columns,
          getRowId: (row) => row.id,
          onRowClick: (row) => setOpened(row.name),
        }}
        selection={{
          selectedIds: selected,
          onSelectRow: (id, checked) =>
            setSelected((current) =>
              checked
                ? [...current, id]
                : current.filter((value) => value !== id),
            ),
          onSelectAll: (checked, ids = []) => setSelected(checked ? ids : []),
        }}
        emptyState={{
          title: "No matching projects",
          description: "No sample projects",
          filteredDescription: "No matching projects",
          isFiltered: Boolean(search),
        }}
        features={{ enableColumnReorder: true, enableRowReorder: false }}
        bottomContent={
          <Text>
            {opened ? `Opened ${opened}` : `${selected.length} selected`}
          </Text>
        }
      />
    </StoryTableHost>
  );
}

const meta = {
  title: "Tables/Unified table page",
  component: ProjectTable,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProjectTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProjectRecords: Story = {};
export const Empty: Story = { args: { empty: true } };
export const Loading: Story = { args: { loading: true } };
