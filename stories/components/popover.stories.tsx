import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@alleato/ui/components/popover";
import { Input } from "@alleato/ui/components/input";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Popover",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Project details</Button>
      </PopoverTrigger>
      <PopoverContent className="grid gap-2" align="start">
        <strong>Document owner</strong>
        <Input aria-label="Document owner" defaultValue="Jordan Smith" />
      </PopoverContent>
    </Popover>
  ),
};
