import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@alleato/ui/components/tooltip";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Tooltip",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Schedule</Button>
        </TooltipTrigger>
        <TooltipContent>Choose an inspection date</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
