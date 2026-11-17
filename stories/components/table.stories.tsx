import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  TableFooter,
} from "@alleato/ui/components/table";

const meta = {
  title: "Components/Table",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Open work by trade</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Trade</TableHead>
          <TableHead>Open items</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Mechanical</TableCell>
          <TableCell>5</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Electrical</TableCell>
          <TableCell>7</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>12</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};
