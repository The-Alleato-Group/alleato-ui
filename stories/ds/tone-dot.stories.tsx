import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToneDot, type ToneDotTone } from "@alleato/ui/ds/tone-dot";

const meta = {
  title: "Patterns/Tone dot",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ul className="flex flex-wrap gap-4">
      {(
        [
          "success",
          "warning",
          "danger",
          "info",
          "financial",
          "neutral",
        ] satisfies ToneDotTone[]
      ).map((tone) => (
        <li key={tone} className="flex items-center gap-2 capitalize">
          <ToneDot tone={tone} />
          {tone}
        </li>
      ))}
    </ul>
  ),
};
