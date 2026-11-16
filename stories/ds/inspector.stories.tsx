import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  InspectorRail,
  InspectorSection,
  PropertyList,
  PropertyRow,
} from "@alleato/ui/ds/inspector";

const meta = {
  title: "Patterns/Inspector",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InspectorRail className="max-w-sm">
      <InspectorSection
        title="Inspection details"
        defaultOpen
        showContentDivider
      >
        <PropertyList>
          <PropertyRow label="Project">North Warehouse</PropertyRow>
          <PropertyRow label="Coordinator">Jordan Smith</PropertyRow>
        </PropertyList>
      </InspectorSection>
      <InspectorSection title="Site access" defaultOpen={false}>
        <p>Use the east loading gate.</p>
      </InspectorSection>
    </InspectorRail>
  ),
};
