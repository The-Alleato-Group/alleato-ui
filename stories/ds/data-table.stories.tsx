import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataTable } from "@alleato/ui/ds/data-table";
import { projects, type Project } from "../sample-data";
import { StatusBadge } from "@alleato/ui/ds/status-badge";

const columns = [
  {
    key: "name",
    header: "Project",
    primary: true,
    render: (row: Project) => row.name,
  },
  { key: "owner", header: "Coordinator", render: (row: Project) => row.owner },
  {
    key: "status",
    header: "Status",
    render: (row: Project) => <StatusBadge status={row.status} />,
  },
];

const meta = {
  title: "Patterns/Data table",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataTable
      columns={columns}
      rows={projects}
      emptyMessage="No projects match."
    />
  ),
};
export const Empty: Story = {
  render: () => (
    <DataTable columns={columns} rows={[]} emptyMessage="No projects match." />
  ),
};
