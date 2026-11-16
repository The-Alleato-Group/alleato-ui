import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableSettingsPopover } from "@alleato/ui/tables/table-settings-popover";
import { Button } from "@alleato/ui/components/button";
import { Checkbox } from "@alleato/ui/components/checkbox";

const meta = {
  title: "Tables/Table settings popover",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TableSettingsPopover
      trigger={<Button variant="outline">View settings</Button>}
      tooltip="View settings"
    >
      <label className="flex items-center gap-2 p-2">
        <Checkbox defaultChecked />
        Show status
      </label>
      <label className="flex items-center gap-2 p-2">
        <Checkbox defaultChecked />
        Show coordinator
      </label>
    </TableSettingsPopover>
  ),
};
