import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TableHorizontalScrollbar } from "@alleato/ui/tables/table-horizontal-scrollbar";
import { useRef } from "react";

function Example() {
  const viewport = useRef<HTMLDivElement>(null);
  return (
    <div className="max-w-sm">
      <div
        ref={viewport}
        id="wide-table"
        className="overflow-x-auto [scrollbar-width:none]"
      >
        <table className="w-[760px]">
          <thead>
            <tr>
              {["Project", "Coordinator", "Trade", "Status", "Date"].map(
                (label) => (
                  <th className="p-3 text-left" key={label}>
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[
                "North Warehouse",
                "Jordan Smith",
                "Mechanical",
                "Active",
                "Nov 16",
              ].map((value) => (
                <td className="p-3" key={value}>
                  {value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <TableHorizontalScrollbar
        viewportRef={viewport}
        controlsId="wide-table"
      />
    </div>
  );
}

const meta = {
  title: "Tables/Horizontal scrollbar",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
