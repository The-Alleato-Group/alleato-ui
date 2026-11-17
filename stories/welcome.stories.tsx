import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowUpRight, ClipboardCheck } from "lucide-react";
import { Button } from "@alleato/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@alleato/ui/components/card";
import { IconBadge } from "@alleato/ui/ds/icon-badge";
import { StatusBadge } from "@alleato/ui/ds/status-badge";
import {
  PageEyebrow,
  PageTitle,
  SectionHeading,
} from "@alleato/ui/layout/headings";

const meta = {
  title: "Start here",
  parameters: { layout: "fullscreen", controls: { disable: true } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const destinations = [
  {
    label: "Components",
    detail: "Buttons, inputs, overlays, and feedback.",
    href: "./?path=/story/components-button--variants",
  },
  {
    label: "Patterns",
    detail: "Status, comments, charts, and editing.",
    href: "./?path=/story/patterns-status-badge--statuses",
  },
  {
    label: "Layouts",
    detail: "Page shells, tabs, and shared gutters.",
    href: "./?path=/story/layouts-page-shell-frame--default",
  },
  {
    label: "Tables",
    detail: "Search, select, and edit sample records.",
    href: "./?path=/story/tables-unified-table-page--project-records",
  },
];

export const Catalog: Story = {
  render: () => (
    <main className="mx-auto grid max-w-4xl gap-8 px-5 py-10 sm:px-10 sm:py-14">
      <header className="grid gap-3">
        <PageEyebrow>Alleato design system</PageEyebrow>
        <PageTitle accentRule>Component catalog</PageTitle>
        <p className="max-w-xl text-muted-foreground">
          Browse the shared web library. Use Controls to change props and the
          theme menu to compare light and dark.
        </p>
      </header>
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <IconBadge>
              <ClipboardCheck />
            </IconBadge>
            <CardTitle>North Warehouse</CardTitle>
            <StatusBadge status="In review" presentation="pill" />
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a
              href="./?path=/story/tables-unified-table-page--project-records"
              target="_parent"
            >
              Explore the project table <ArrowUpRight />
            </a>
          </Button>
        </CardContent>
      </Card>
      <section className="grid gap-3" aria-labelledby="catalog-sections">
        <SectionHeading id="catalog-sections">
          Browse by category
        </SectionHeading>
        <div className="grid gap-2 sm:grid-cols-2">
          {destinations.map(({ label, detail, href }) => (
            <a
              className="group grid gap-1 rounded-md border p-4 hover:bg-muted/50"
              href={href}
              target="_parent"
              key={label}
            >
              <span className="flex items-center justify-between gap-2 font-medium">
                {label}
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </span>
              <span className="text-sm text-muted-foreground">{detail}</span>
            </a>
          ))}
        </div>
      </section>
    </main>
  ),
};
