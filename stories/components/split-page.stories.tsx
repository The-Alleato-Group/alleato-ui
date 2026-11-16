import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  SplitPage,
  SplitPageFrame,
  useSplitPage,
} from "@alleato/ui/components/split-page";
import { Button } from "@alleato/ui/components/button";

function ProjectList() {
  const { onOpen } = useSplitPage();
  return (
    <div className="p-4">
      <Button variant="outline" onClick={onOpen}>
        North Warehouse
      </Button>
    </div>
  );
}

const meta = {
  title: "Components/Split page",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SplitPageFrame>
      <SplitPage>
        <ProjectList />
        <section className="p-4">
          Inspection details for North Warehouse
        </section>
      </SplitPage>
    </SplitPageFrame>
  ),
};
