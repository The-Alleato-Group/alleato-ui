import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toaster } from "@alleato/ui/components/sonner";
import { toast } from "sonner";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Toast",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (_args, context) => (
    <>
      <Toaster theme={context.globals.theme === "Dark" ? "dark" : "light"} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast("Inspection reminder")}>
          Show reminder
        </Button>
        <Button onClick={() => toast.success("Inspection saved")}>
          Show success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error("Could not save the inspection")}
        >
          Show error
        </Button>
      </div>
    </>
  ),
};
