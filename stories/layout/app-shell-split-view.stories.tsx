import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  APP_SHELL_SPLIT_VIEW_CLASSNAME,
  APP_SHELL_SPLIT_VIEW_MARKER,
  APP_SHELL_SPLIT_VIEW_COLUMN_CLASSNAME,
} from "@alleato/ui/layout/app-shell-split-view";

const meta = {
  title: "Layouts/App shell split view",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div
      className={APP_SHELL_SPLIT_VIEW_CLASSNAME}
      data-slot={APP_SHELL_SPLIT_VIEW_MARKER}
    >
      <div className={APP_SHELL_SPLIT_VIEW_COLUMN_CLASSNAME}>
        <div className="p-4">Available inspection reports</div>
      </div>
      <div className={APP_SHELL_SPLIT_VIEW_COLUMN_CLASSNAME}>
        <div className="p-4">Inspection report detail</div>
      </div>
    </div>
  ),
};
