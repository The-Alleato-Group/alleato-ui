import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KanbanColumnShell, KanbanCardShell } from "@alleato/ui/ds/kanban";

const meta = {
  title: "Patterns/Kanban",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
      <KanbanColumnShell title="In progress" count={1} tone="info">
        <KanbanCardShell density="default">
          <p className="font-medium">Inspect riser room</p>
          <p className="text-sm text-muted-foreground">Jordan Smith</p>
        </KanbanCardShell>
      </KanbanColumnShell>
      <KanbanColumnShell title="Complete" count={1} tone="success">
        <KanbanCardShell density="compact">
          Verify east loading gate
        </KanbanCardShell>
      </KanbanColumnShell>
    </div>
  ),
};
