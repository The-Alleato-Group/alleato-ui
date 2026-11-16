import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@alleato/ui/components/collapsible";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Collapsible",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="grid max-w-sm gap-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline">Site notes</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        Safety orientation is required at check-in.
      </CollapsibleContent>
    </Collapsible>
  ),
};
