import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@alleato/ui/components/input-group";

const meta = {
  title: "Components/Input group",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputGroup className="max-w-sm">
      <InputGroupAddon>
        <InputGroupText>USD</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        placeholder="0.00"
        aria-label="Amount in USD"
      />
    </InputGroup>
  ),
};
