import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  SidePanel,
  SidePanelTrigger,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelClose,
  SidePanelBody,
} from "@alleato/ui/components/side-panel";
import { Button } from "@alleato/ui/components/button";

const meta = {
  title: "Components/Side panel",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button variant="outline">Open side panel</Button>
      </SidePanelTrigger>
      <SidePanelContent size="compact" resizable>
        <SidePanelHeader>
          <SidePanelTitle>Inspection details</SidePanelTitle>
          <SidePanelDescription>
            Review the current inspection assignment.
          </SidePanelDescription>
        </SidePanelHeader>
        <SidePanelBody>
          <p className="px-4 py-3 text-sm">Assigned to Jordan Smith.</p>
        </SidePanelBody>
        <SidePanelFooter>
          <SidePanelClose asChild>
            <Button variant="outline">Done</Button>
          </SidePanelClose>
        </SidePanelFooter>
      </SidePanelContent>
    </SidePanel>
  ),
};
