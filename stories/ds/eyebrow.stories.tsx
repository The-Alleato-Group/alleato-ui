import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Eyebrow } from "@alleato/ui/ds/eyebrow";

const meta = {
  title: "Patterns/Eyebrow",
  component: Eyebrow,
  args: { children: "Project overview" },
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
