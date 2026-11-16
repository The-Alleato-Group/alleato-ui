import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuSeparator,
} from "@alleato/ui/components/context-menu";

const meta = {
  title: "Components/Context menu",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="grid h-24 max-w-sm place-items-center rounded-md border border-dashed">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open record</ContextMenuItem>
        <ContextMenuCheckboxItem checked>
          Include archived
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled>Delete record</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
