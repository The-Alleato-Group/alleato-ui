import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@alleato/ui/components/button-group";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Button group",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button>Assign</Button>
      <ButtonGroupSeparator />
      <Button>Schedule</Button>
    </ButtonGroup>
  ),
};
