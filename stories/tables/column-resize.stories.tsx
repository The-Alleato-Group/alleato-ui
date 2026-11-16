import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ColumnResizeHandle,
  useColumnResizeDrag,
} from "@alleato/ui/tables/column-resize";
import { useState } from "react";

function Example() {
  const [width, setWidth] = useState(220);
  const resize = (_columnId: string, next: number) => setWidth(next);
  const { startColumnResize } = useColumnResizeDrag({ onResize: resize });
  return (
    <div className="relative border p-3" style={{ width }}>
      Project name{" "}
      <ColumnResizeHandle
        columnId="project"
        label="Resize project column"
        width={width}
        onKeyResize={resize}
        onResizeStart={(event) => startColumnResize(event, "project", width)}
      />
      <output className="ml-2 text-muted-foreground">
        {Math.round(width)} px
      </output>
    </div>
  );
}

const meta = {
  title: "Tables/Column resize",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
