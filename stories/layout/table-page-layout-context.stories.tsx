import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  TablePageLayoutProvider,
  useTablePageShellOwnsLayout,
} from "@alleato/ui/layout/table-page-layout-context";
function Ownership() {
  const shellOwnsLayout = useTablePageShellOwnsLayout();
  return (
    <p>
      {shellOwnsLayout
        ? "Table inside a shell: the shell owns the gutter."
        : "Standalone table: the table owns the gutter."}
    </p>
  );
}

const meta = {
  title: "Layouts/Table page layout",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid gap-3">
      <Ownership />
      <TablePageLayoutProvider>
        <Ownership />
      </TablePageLayoutProvider>
    </div>
  ),
};
