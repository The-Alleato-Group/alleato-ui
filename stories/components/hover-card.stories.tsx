import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@alleato/ui/components/hover-card";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Hover card",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="#coordinator" className="underline">
          Jordan Smith
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="grid gap-1">
        <strong>Jordan Smith</strong>
        <span className="text-sm text-muted-foreground">
          Field coordinator · North Warehouse
        </span>
      </HoverCardContent>
    </HoverCard>
  ),
};
