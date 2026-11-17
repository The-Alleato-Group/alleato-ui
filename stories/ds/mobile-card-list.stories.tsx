import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MobileCardList } from "@alleato/ui/ds/mobile-card-list";
import { useState } from "react";
import { projects, type Project } from "../sample-data";

const columns = [
  { id: "name", label: "Project", render: (project: Project) => project.name },
  {
    id: "owner",
    label: "Coordinator",
    render: (project: Project) => project.owner,
  },
  {
    id: "status",
    label: "Status",
    render: (project: Project) => project.status,
  },
  { id: "id", label: "Record", render: (project: Project) => project.id },
];

function Example() {
  const [opened, setOpened] = useState("");
  return (
    <div className="max-w-sm">
      <MobileCardList
        items={projects}
        columns={columns}
        getRowId={(project) => project.id}
        hasRowActions={false}
        showMoreDetails
        onRowClick={(project) => setOpened(project.name)}
      />
      {opened && <p role="status">Opened {opened}</p>}
    </div>
  );
}

const meta = {
  title: "Patterns/Mobile card list",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
