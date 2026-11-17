import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  PageTitle,
  PageEyebrow,
  SectionHeading,
  SubsectionHeading,
  LabelHeading,
} from "@alleato/ui/layout/headings";

const meta = {
  title: "Layouts/Headings",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid gap-4">
      <div>
        <PageEyebrow>Projects / PRJ-101</PageEyebrow>
        <PageTitle accentRule>North Warehouse</PageTitle>
      </div>
      <SectionHeading>Inspection summary</SectionHeading>
      <SubsectionHeading>Site access</SubsectionHeading>
      <LabelHeading>Field coordinator</LabelHeading>
    </div>
  ),
};
