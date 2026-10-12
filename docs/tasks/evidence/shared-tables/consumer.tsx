import * as React from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "../../../../src/components/tooltip";
import { Heading } from "../../../../src/ds/heading";
import { Text } from "../../../../src/ds/text";
import { StatusBadge } from "../../../../src/ds/status-badge";
import { PageTabs } from "../../../../src/layout/page-tabs";
import { TableHostProvider, type TableHost, type UnifiedTablePreferences } from "../../../../src/tables/table-host";
import { UnifiedTablePage, type TableColumn } from "../../../../src/tables/unified-table-page";

type Project = { id: string; name: string; owner: string; status: string };
const initialRows: Project[] = [
  { id: "1", name: "Warehouse expansion", owner: "Megan", status: "active" },
  { id: "2", name: "Office renovation", owner: "Alex", status: "planned" },
  { id: "3", name: "Distribution center", owner: "Sam", status: "active" },
];
const preferenceKey = "shared-table-example:preferences";

// Only presentation runs here. Unsupported writes fail explicitly if enabled.
// A real app supplies its existing services, as PM and Training do.
const host: TableHost = {
  PageHeader: ({ title, titleContent, actions, description }) => <>
    <Heading level={2} as="h1">{titleContent ?? title}</Heading>
    {description && <Text tone="muted">{description}</Text>}
    {actions}
  </>,
  PageTabs: props => <PageTabs {...props} pathname="/projects" onNavigate={() => { throw new Error("This sample has no route tabs."); }} />,
  HeaderActions: ({ children }) => <>{children}</>,
  SectionRuleHeading: ({ label, className }) => <Heading level={5} className={className}>{label}</Heading>,
  BulkEditDialog: ({ open }) => {
    if (open) throw new Error("Enable bulk writes only after supplying the app dialog.");
    return null;
  },
  TableViewsMenu: () => { throw new Error("Enable saved views only after supplying app persistence."); },
  useTableSidePanelController: () => ({ width: 560, collapsed: false,
    onToggleCollapsed: () => { throw new Error("This sample uses the shared split view."); },
    onResizeStart: () => { throw new Error("This sample uses the shared split view."); },
  }),
  readUnifiedTablePreferences: () => JSON.parse(localStorage.getItem(preferenceKey) ?? "{}") as UnifiedTablePreferences,
  saveUnifiedTablePreferences: updates => localStorage.setItem(preferenceKey, JSON.stringify({ ...host.readUnifiedTablePreferences(), ...updates })),
  storage: localStorage,
  reportNonCriticalFailure: context => console.error(context.operation, context.error),
  toast: { success: message => console.info(message), error: (message, options) => console.error(message, options?.description) },
};

function ExampleConsumer() {
  const [rows, setRows] = React.useState(initialRows);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>([]);
  const [opened, setOpened] = React.useState<string | null>(null);
  const columns: TableColumn<Project>[] = [
    { id: "name", label: "Project", render: row => row.name, sortValue: row => row.name, filterValue: row => row.name,
      sortable: true, editable: true, editValue: row => row.name,
      onEdit: (row, value) => setRows(current => current.map(item => item.id === row.id ? { ...item, name: String(value) } : item)),
    },
    { id: "owner", label: "Owner", render: row => row.owner, sortValue: row => row.owner, filterValue: row => row.owner, sortable: true },
    { id: "status", label: "Status", render: row => <StatusBadge status={row.status} />, filterValue: row => row.status },
  ];
  return <TooltipProvider><TableHostProvider host={host}>
    <UnifiedTablePage<Project>
      header={{ title: "Shared project table", description: "Sample records using the package table, filters, edits and responsive views." }}
      toolbar={{ totalItems: rows.length, filteredItems: rows.length, searchValue: search, onSearchChange: setSearch,
        excludedViews: ["board", "card"],
        filters: [{ id: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "planned", label: "Planned" }] }],
      }}
      data={{ items: rows.filter(row => `${row.name} ${row.owner}`.toLowerCase().includes(search.toLowerCase())), isLoading: false }}
      table={{ columns, getRowId: row => row.id, onRowClick: row => setOpened(row.name) }}
      selection={{ selectedIds: selected,
        onSelectRow: (id, checked) => setSelected(current => checked ? [...current, id] : current.filter(value => value !== id)),
        onSelectAll: (checked, ids = []) => setSelected(checked ? ids : []),
      }}
      emptyState={{ title: "No projects", description: "No sample projects", filteredDescription: "No matching projects", isFiltered: Boolean(search) }}
      features={{ enableColumnReorder: true, enableRowReorder: false }}
      bottomContent={<Text>{opened ? `Opened ${opened}` : `${selected.length} selected`}</Text>}
    />
  </TableHostProvider></TooltipProvider>;
}

createRoot(document.getElementById("root")!).render(<ExampleConsumer />);
