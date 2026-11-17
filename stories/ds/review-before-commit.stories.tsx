import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReviewBeforeCommit } from "@alleato/ui/ds/review-before-commit";
import { useState } from "react";
import { DetailField } from "@alleato/ui/ds/DetailField";

function Example() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [created, setCreated] = useState(false);
  return (
    <div className="max-w-xl">
      <ReviewBeforeCommit
        heading="Review inspection"
        actionLabel="Create inspection"
        checks={[{ id: "scope", label: "Inspection scope verified" }]}
        checkedIds={checked}
        onCheckedChange={(id, value) =>
          setChecked(value ? new Set([id]) : new Set())
        }
        onConfirm={() => setCreated(true)}
        receipt={
          created
            ? {
                title: "Inspection created",
                description: "The North Warehouse inspection is ready.",
                recordId: "INS-04",
              }
            : null
        }
      >
        <DetailField label="Project">North Warehouse</DetailField>
      </ReviewBeforeCommit>
    </div>
  );
}

const meta = {
  title: "Patterns/Review before commit",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
