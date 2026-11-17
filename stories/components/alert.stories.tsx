import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@alleato/ui/components/alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  args: { variant: "default" },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="max-w-lg">
      <AlertTitle>Drawing revision available</AlertTitle>
      <AlertDescription>
        Review revision 04 before issuing the takeoff.
      </AlertDescription>
    </Alert>
  ),
};
export const Destructive: Story = { args: { variant: "destructive" } };
