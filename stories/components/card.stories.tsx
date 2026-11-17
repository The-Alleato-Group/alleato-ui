import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@alleato/ui/components/card";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Card",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>North Warehouse</CardTitle>
        <CardDescription>Inspection checklist</CardDescription>
      </CardHeader>
      <CardContent>8 of 12 checkpoints are complete.</CardContent>
      <CardFooter>
        <Button variant="outline">View checklist</Button>
      </CardFooter>
    </Card>
  ),
};
