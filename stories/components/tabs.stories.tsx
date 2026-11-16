import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@alleato/ui/components/tabs";

const meta = {
  title: "Components/Tabs",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="max-w-sm">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="archive" disabled>
          Archive
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">8 checkpoints complete</TabsContent>
      <TabsContent value="activity">Drawing revision was uploaded</TabsContent>
    </Tabs>
  ),
};
