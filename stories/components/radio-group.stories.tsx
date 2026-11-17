import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RadioGroup, RadioGroupItem } from "@alleato/ui/components/radio-group";

const meta = {
  title: "Components/Radio group",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="daily" aria-label="Digest frequency">
      {["daily", "weekly", "monthly"].map((frequency) => (
        <label className="flex items-center gap-2 capitalize" key={frequency}>
          <RadioGroupItem
            value={frequency}
            disabled={frequency === "monthly"}
          />
          {frequency}
        </label>
      ))}
    </RadioGroup>
  ),
};
