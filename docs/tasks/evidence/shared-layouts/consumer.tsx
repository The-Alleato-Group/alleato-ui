import * as React from "react";
import { createRoot } from "react-dom/client";
import { PageShellFrame } from "../../../../src/layout/page-shell-frame";
import { PageTabs } from "../../../../src/layout/page-tabs";
import { MobileCardList } from "../../../../src/ds/mobile-card-list";
import { DataTable } from "../../../../src/ds/data-table";
import { StatusBadge } from "../../../../src/ds/status-badge";
import { Heading } from "../../../../src/ds/heading";
import { Text } from "../../../../src/ds/text";

const rows = [
  { id: "1", name: "Warehouse expansion", owner: "Megan", status: "active" },
  { id: "2", name: "Office renovation", owner: "Alex", status: "active" },
  { id: "3", name: "Distribution center", owner: "Sam", status: "planned" },
];

function ExampleConsumer() {
  const [view, setView] = React.useState("all");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [opened, setOpened] = React.useState<string | null>(null);
  const filtered = rows.filter((row) => view !== "active" || row.status === "active");
  const columns = [
    { id: "name", label: "Project", render: (row: typeof rows[number]) => row.name },
    { id: "owner", label: "Owner", render: (row: typeof rows[number]) => row.owner },
    { id: "status", label: "Status", render: (row: typeof rows[number]) => <StatusBadge status={row.status} /> },
  ];
  return (
    <PageShellFrame variant="table" header={
      <>
        <Heading level={1}>Shared project components</Heading>
        <Text tone="muted">Local library example with sample records. Routing and data belong to this consumer.</Text>
        <PageTabs pathname="/projects" search={`view=${view}`} onNavigate={(href) => setView(new URL(href, "https://example.test").searchParams.get("view") ?? "all")}
          tabs={[{ label: "All projects", href: "/projects?view=all", count: rows.length }, { label: "Active", href: "/projects?view=active", count: 2 }]} />
      </>
    }>
      <div className="hidden sm:block">
        <DataTable rows={filtered} columns={columns.map((column, index) => ({ key: column.id, header: column.label, render: column.render, primary: index === 0 }))}
          onRowClick={(row) => setOpened(row.name)} />
      </div>
      <MobileCardList items={filtered} columns={columns} getRowId={(row) => row.id} hasRowActions={false}
        selectedIds={selected} onSelectRow={(id, checked) => setSelected((current) => checked ? [...current, id] : current.filter((value) => value !== id))}
        onRowClick={(row) => setOpened(row.name)} />
      <Text>{opened ? `Opened ${opened}` : `${selected.length} selected`}</Text>
    </PageShellFrame>
  );
}
createRoot(document.getElementById("root")!).render(<ExampleConsumer />);
