import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogClose,
} from "@alleato/ui/components/responsive-dialog";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Responsive dialog",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline">Open responsive dialog</Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Inspection details</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Review the current inspection assignment.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <p className="px-4 py-3 text-sm">Assigned to Jordan Smith.</p>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <Button variant="outline">Done</Button>
          </ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  ),
};
