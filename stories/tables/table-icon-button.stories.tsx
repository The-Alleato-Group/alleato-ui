import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  TableIconAction,
  TableIconButton,
} from "@alleato/ui/tables/table-icon-button";
import { RefreshCw, Upload } from "lucide-react";

const meta = {
  title: "Tables/Table icon action",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex gap-2">
      <TableIconAction label="Refresh projects">
        <RefreshCw />
      </TableIconAction>
      <TableIconButton aria-label="Upload report" disabled>
        <Upload />
      </TableIconButton>
    </div>
  ),
};
