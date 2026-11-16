import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "@alleato/ui/components/select";

const meta = {
  title: "Components/Select",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="open">
      <SelectTrigger aria-label="Issue status" className="w-56">
        <SelectValue placeholder="Choose a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Status</SelectLabel>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="review">In review</SelectItem>
          <SelectItem value="closed" disabled>
            Closed
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
