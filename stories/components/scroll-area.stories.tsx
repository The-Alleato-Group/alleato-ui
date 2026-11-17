import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea } from "@alleato/ui/components/scroll-area";

const meta = {
  title: "Components/Scroll area",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-64 rounded-md border p-3">
      <ol className="grid gap-2">
        {Array.from({ length: 24 }, (_, i) => (
          <li key={i} className="border-b pb-2">
            Inspection checkpoint {i + 1}
          </li>
        ))}
      </ol>
    </ScrollArea>
  ),
};
