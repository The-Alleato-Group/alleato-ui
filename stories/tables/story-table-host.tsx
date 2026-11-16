import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { TooltipProvider } from "@alleato/ui/components/tooltip";
import { Toaster } from "@alleato/ui/components/sonner";
import { PageTitle, SectionHeading } from "@alleato/ui/layout/headings";
import { PageTabs } from "@alleato/ui/layout/page-tabs";
import {
  TableHostProvider,
  type TableHost,
  type UnifiedTablePreferences,
} from "@alleato/ui/tables/table-host";

function createStoryHost(): TableHost {
  let preferences: UnifiedTablePreferences = {};
  const storage = new Map<string, string>();
  return {
    PageHeader: ({ title, titleContent, actions, description }) => (
      <header className="grid gap-2 py-4">
        {titleContent ?? <PageTitle>{title}</PageTitle>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {actions}
      </header>
    ),
    PageTabs: (props) => {
      const [path, setPath] = useState(props.tabs[0]?.href);
      return <PageTabs {...props} pathname={path} onNavigate={setPath} />;
    },
    HeaderActions: ({ children }) => <>{children}</>,
    SectionRuleHeading: ({ label, className }) => (
      <SectionHeading className={className}>{label}</SectionHeading>
    ),
    BulkEditDialog: () => null,
    TableViewsMenu: () => null,
    useTableSidePanelController: () => ({
      width: 420,
      collapsed: false,
      onToggleCollapsed: () => {},
      onResizeStart: () => {},
    }),
    readUnifiedTablePreferences: () => preferences,
    saveUnifiedTablePreferences: (updates) => {
      preferences = { ...preferences, ...updates };
    },
    storage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    },
    reportNonCriticalFailure: ({ operation, error }) =>
      console.error(operation, error),
    toast: { success: toast.success, error: toast.error },
  };
}

/** A fresh, in-memory host for each story mount. No Alleato service calls. */
export function StoryTableHost({ children }: { children: ReactNode }) {
  const [host] = useState(createStoryHost);
  return (
    <TooltipProvider>
      <TableHostProvider host={host}>
        {children}
        <Toaster />
      </TableHostProvider>
    </TooltipProvider>
  );
}
