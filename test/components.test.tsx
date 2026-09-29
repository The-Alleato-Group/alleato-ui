import { readdirSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { Badge } from "../src/components/badge";
import { Button } from "../src/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/card";
import { Input } from "../src/components/input";
import { Label } from "../src/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/table";

const componentsDir = path.resolve(__dirname, "../src/components");
const modules = readdirSync(componentsDir).filter((file) => /\.tsx?$/.test(file));

describe("every component module", () => {
  it.each(modules)("%s loads and exports something", async (file) => {
    const mod = await import(`../src/components/${file}`);
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });

  it("imports nothing from an app (no @/ aliases)", async () => {
    const { readFileSync } = await import("node:fs");
    const offenders = modules.filter((file) =>
      /from ["']@\//.test(readFileSync(path.join(componentsDir, file), "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});

describe("the primitives ASRS needs render", () => {
  it("Button, Input, Label, Card, Badge, Table", () => {
    render(
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Alleato" />
        <Button>Save</Button>
        <Badge>Open</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Estimate</CardTitle>
          </CardHeader>
          <CardContent>Body</CardContent>
        </Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Racking</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>,
    );
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Alleato");
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("Estimate")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Racking" })).toBeTruthy();
  });
});
