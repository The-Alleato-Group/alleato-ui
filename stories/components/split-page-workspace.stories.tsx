import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  SplitPageWorkspace,
  SplitPageWorkspaceRailHeader,
  SplitPageWorkspaceRowContent,
  SplitPageWorkspaceDetailContent,
} from "@alleato/ui/components/split-page-workspace";

const meta = {
  title: "Components/Split page workspace",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SplitPageWorkspace>
      <div>
        <SplitPageWorkspaceRailHeader title="Projects" />
        <div className="p-4">
          <SplitPageWorkspaceRowContent
            title="North Warehouse"
            metadata={[{ key: "id", label: "PRJ-101" }]}
          />
        </div>
      </div>
      <SplitPageWorkspaceDetailContent>
        <div className="p-4">Construction progress</div>
      </SplitPageWorkspaceDetailContent>
    </SplitPageWorkspace>
  ),
};
