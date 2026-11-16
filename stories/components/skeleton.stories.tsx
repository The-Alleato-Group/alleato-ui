import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "@alleato/ui/components/skeleton";

const meta = {
  title: "Components/Skeleton",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-12 rounded-full" />
      <div className="grid gap-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  ),
};
