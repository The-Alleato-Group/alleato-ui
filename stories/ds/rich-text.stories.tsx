import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RichText } from "@alleato/ui/ds/rich-text";

const meta = {
  title: "Patterns/Rich text",
  component: RichText,
  args: {
    value:
      "<p><strong>Access:</strong> use the east loading gate.</p><ul><li>Check in with site security.</li><li>Bring a hard hat.</li></ul>",
  },
} satisfies Meta<typeof RichText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
