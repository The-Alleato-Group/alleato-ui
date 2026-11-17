import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageTabs } from "@alleato/ui/layout/page-tabs";
import { useState } from "react";

const tabs = [
  { label: "Overview", href: "/overview" },
  { label: "Inspections", href: "/inspections", count: 8 },
  {
    label: "Reports",
    href: "/reports",
    items: [{ label: "Weekly report", href: "/reports/weekly" }],
  },
];

function Example() {
  const [path, setPath] = useState("/overview");
  return (
    <div className="grid gap-4">
      <PageTabs pathname={path} tabs={tabs} onNavigate={setPath} />
      <p role="status">
        Current view: {tabs.find((tab) => path.startsWith(tab.href))?.label}
      </p>
    </div>
  );
}

const meta = {
  title: "Layouts/Page tabs",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
