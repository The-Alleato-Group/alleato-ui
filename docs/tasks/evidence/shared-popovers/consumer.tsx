import * as React from "react";
import { createRoot } from "react-dom/client";
import { DateRangePicker } from "../../../../src/ds/date-range-picker";
import type { DateRange } from "react-day-picker";
import { Button } from "../../../../src/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../src/components/popover";

/** Exercise the actual shared popup owner using public sample state only. */
function PopoverExample() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(2026, 9, 12), to: new Date(2026, 9, 23),
  });
  return <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
    <h1 className="text-xl">Shared popover controls</h1>
    <p className="text-sm text-muted-foreground">Public sample. Changes stay in this page.</p>
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Date range</h2>
      <DateRangePicker ariaLabel="Sample date range" value={range} onChange={setRange} />
      <p role="status" className="text-sm">{range?.from ? "A sample range is selected." : "Sample range cleared."}</p>
    </section>
    <Popover>
      <PopoverTrigger asChild><Button variant="outline">Open long popup</Button></PopoverTrigger>
      <PopoverContent>
        <ol className="space-y-4">{Array.from({length:24},(_,i)=><li key={i}>Sample item {i+1}</li>)}</ol>
        <Button onClick={() => setRange(undefined)}>Clear sample range</Button>
      </PopoverContent>
    </Popover>
  </main>;
}

createRoot(document.getElementById("root")!).render(<PopoverExample />);
