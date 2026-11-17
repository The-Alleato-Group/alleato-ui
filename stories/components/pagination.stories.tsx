import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@alleato/ui/components/pagination";
import { useState } from "react";
function Example() {
  const [page, setPage] = useState(1);
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#previous"
            onClick={(event) => {
              event.preventDefault();
              setPage(Math.max(1, page - 1));
            }}
          />
        </PaginationItem>
        {[1, 2, 3].map((value) => (
          <PaginationItem key={value}>
            <PaginationLink
              href={`#page-${value}`}
              isActive={page === value}
              onClick={(event) => {
                event.preventDefault();
                setPage(value);
              }}
            >
              {value}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href="#next"
            onClick={(event) => {
              event.preventDefault();
              setPage(Math.min(3, page + 1));
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

const meta = {
  title: "Components/Pagination",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = { render: Example };
