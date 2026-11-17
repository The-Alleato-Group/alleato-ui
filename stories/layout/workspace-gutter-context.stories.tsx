import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkspaceGutterProvider } from "@alleato/ui/layout/workspace-gutter-context";
import { PageContainer } from "@alleato/ui/layout/page-container";

const meta = {
  title: "Layouts/Workspace gutter",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid gap-4">
      <PageContainer>
        <div className="rounded-md border p-3">
          Page container owns the gutter
        </div>
      </PageContainer>
      <WorkspaceGutterProvider>
        <div className="px-4 sm:px-6 lg:px-8">
          <PageContainer>
            <div className="rounded-md border p-3">
              Workspace owns the gutter
            </div>
          </PageContainer>
        </div>
      </WorkspaceGutterProvider>
    </div>
  ),
};
