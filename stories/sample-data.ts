export type Project = {
  id: string;
  name: string;
  owner: string;
  status: string;
};

export const projects: Project[] = [
  {
    id: "PRJ-101",
    name: "North Warehouse",
    owner: "Jordan Smith",
    status: "Active",
  },
  {
    id: "PRJ-102",
    name: "Riverfront Expansion",
    owner: "Morgan Lee",
    status: "In review",
  },
  {
    id: "PRJ-103",
    name: "East Distribution Center",
    owner: "Taylor Reed",
    status: "Planned",
  },
];

export const inspectionTrend = [
  { date: "2026-11-10", value: 4 },
  { date: "2026-11-11", value: 7 },
  { date: "2026-11-12", value: 6 },
  { date: "2026-11-13", value: 10 },
  { date: "2026-11-14", value: 5 },
];

export const samplePeople = projects.map(({ id, owner }) => ({
  id,
  full_name: owner,
  email: null,
}));

export const statuses = [
  { value: "active", label: "Active" },
  { value: "review", label: "In review" },
  { value: "planned", label: "Planned" },
];
