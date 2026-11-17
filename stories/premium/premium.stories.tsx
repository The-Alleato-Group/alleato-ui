import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Building2,
  House,
  Leaf,
  SlidersHorizontal,
  Sparkles,
  Waves,
  Wifi,
} from "lucide-react";
import { Button } from "@alleato/ui/components/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@alleato/ui/components/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@alleato/ui/components/accordion";
import { Checkbox } from "@alleato/ui/components/checkbox";
import { Switch } from "@alleato/ui/components/switch";
import { ExpandingSearch } from "@alleato/ui/ds/expanding-search";
import { SegmentedControl } from "@alleato/ui/ds/segmented-control";
import { SelectionCard } from "@alleato/ui/ds/selection-card";
import { QuantityStepper } from "@alleato/ui/ds/quantity-stepper";
import { FavoriteButton } from "@alleato/ui/ds/favorite-button";
import { MediaCard } from "@alleato/ui/ds/media-card";
import { MotionReveal } from "@alleato/ui/ds/motion-reveal";
const interior = new URL("../assets/interior.jpg", import.meta.url).href;
const retreat = new URL("../assets/retreat.jpg", import.meta.url).href;
const cabin = new URL("../assets/cabin.jpg", import.meta.url).href;

const meta = {
  title: "Premium/Interaction library",
  parameters: { layout: "fullscreen", controls: { disable: true } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const types = [
  { value: "all", label: "All spaces" },
  { value: "house", label: "Homes" },
  { value: "retreat", label: "Retreats" },
];
const places = [
  {
    id: "courtyard",
    title: "The courtyard house",
    subtitle: "Quiet corners. Natural light.",
    image: interior,
    alt: "A sunlit living room with plants and a brown sofa",
    type: "house",
    badge: "Guest favorite",
    price: "$240",
    features: ["wifi", "garden"],
    capacity: 4,
    instant: true,
    accessible: true,
  },
  {
    id: "hideaway",
    title: "A slower kind of weekend",
    subtitle: "A retreat, close to nature.",
    image: retreat,
    alt: "A quiet desk and chair against a pale wall",
    type: "retreat",
    badge: "New discovery",
    price: "$185",
    features: ["garden"],
    capacity: 2,
    instant: true,
    accessible: false,
  },
  {
    id: "cabin",
    title: "Somewhere among the trees",
    subtitle: "Room to breathe, space to stay.",
    image: cabin,
    alt: "A lit timber cabin beside a snowy lake",
    type: "house",
    badge: "Guest favorite",
    price: "$210",
    features: ["wifi"],
    capacity: 6,
    instant: false,
    accessible: true,
  },
];

type Filters = {
  amenities: string[];
  guests: number;
  instant: boolean;
  accessible: boolean;
};
function FilterPanel({
  onApply,
  value,
  open,
}: {
  onApply: (filters: Filters) => void;
  value: Filters;
  open: boolean;
}) {
  const [amenities, setAmenities] = useState<string[]>([]);
  const [guests, setGuests] = useState(2);
  const [instant, setInstant] = useState(false);
  const [accessible, setAccessible] = useState(false);
  useEffect(() => {
    if (open) {
      setAmenities(value.amenities);
      setGuests(value.guests);
      setInstant(value.instant);
      setAccessible(value.accessible);
    }
  }, [open, value]);
  const toggle = (value: string, selected: boolean) =>
    setAmenities((current) =>
      selected ? [...current, value] : current.filter((item) => item !== value),
    );
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Make room for your kind of stay</DialogTitle>
        <DialogDescription>
          Choose what matters. Leave the rest open.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-7 py-3">
        <fieldset className="grid gap-3">
          <legend className="mb-3 text-base font-semibold">
            A few essentials
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <SelectionCard
              label="Connected"
              description="Reliable Wi-Fi"
              icon={<Wifi />}
              selected={amenities.includes("wifi")}
              onSelectedChange={(selected) => toggle("wifi", selected)}
            />
            <SelectionCard
              label="Room outside"
              description="A garden to enjoy"
              icon={<Leaf />}
              selected={amenities.includes("garden")}
              onSelectedChange={(selected) => toggle("garden", selected)}
            />
          </div>
        </fieldset>
        <QuantityStepper
          label="Guests"
          description="Who is coming along?"
          min={1}
          max={8}
          value={guests}
          onValueChange={setGuests}
        />
        <label className="flex min-h-11 items-center justify-between gap-4 text-sm font-medium">
          Instant booking
          <Switch checked={instant} onCheckedChange={setInstant} />
        </label>
        <Accordion type="single" collapsible>
          <AccordionItem value="accessibility">
            <AccordionTrigger>Accessibility</AccordionTrigger>
            <AccordionContent>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <Checkbox
                  checked={accessible}
                  onCheckedChange={(checked) => setAccessible(checked === true)}
                />{" "}
                Step-free entrance
              </label>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() => {
            setAmenities([]);
            setGuests(2);
            setInstant(false);
            setAccessible(false);
          }}
        >
          Reset
        </Button>
        <DialogClose asChild>
          <Button
            type="button"
            className="h-11 rounded-xl"
            onClick={() => onApply({ amenities, guests, instant, accessible })}
          >
            Apply filters
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}

function Workbench() {
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    amenities: [] as string[],
    guests: 2,
    instant: false,
    accessible: false,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const detailTrigger = useRef<HTMLAnchorElement | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);
  const visible = places.filter(
    (place) =>
      (type === "all" || place.type === type) &&
      place.title.toLowerCase().includes(search.toLowerCase()) &&
      filters.amenities.every((feature) => place.features.includes(feature)) &&
      place.capacity >= filters.guests &&
      (!filters.instant || place.instant) &&
      (!filters.accessible || place.accessible),
  );
  const activeFilters =
    filters.amenities.length +
    (filters.guests !== 2 ? 1 : 0) +
    (filters.instant ? 1 : 0) +
    (filters.accessible ? 1 : 0);
  const detail = places.find((place) => place.id === selectedPlace);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <nav
        aria-label="Library navigation"
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <a
          href="./?path=/story/start-here--catalog"
          target="_parent"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
            <Sparkles aria-hidden="true" className="size-4" />
          </span>
          Alleato / Components
        </a>
        <a
          href="https://mobbin.com/flows/c88c5d8a-56ab-4823-87fc-7ed6f335c0fd"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          View reference <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </nav>
      <header className="grid gap-4 pb-8 pt-8 sm:pt-12">
        <h1
          data-plain-heading
          className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl"
        >
          Components in motion.
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          Airbnb-inspired controls, built for the shared library.
        </p>
      </header>
      <section aria-labelledby="spaces-title" className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="spaces-title" className="text-xl font-semibold">
            Spaces worth a closer look
          </h2>
          <Button
            variant="ghost"
            className="h-11"
            onClick={() => setReplay((current) => current + 1)}
          >
            Replay entrance
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            label="Space type"
            value={type}
            onValueChange={setType}
            options={types}
          />
          <div className="flex items-center gap-2">
            <ExpandingSearch
              value={search}
              onChange={setSearch}
              ariaLabel="Search spaces"
              triggerClassName="size-11"
            />
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 rounded-xl">
                  <SlidersHorizontal aria-hidden="true" />
                  Filters
                  {activeFilters > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                      {activeFilters}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <FilterPanel
                onApply={setFilters}
                value={filters}
                open={filterOpen}
              />
            </Dialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground" role="status">
          {visible.length} {visible.length === 1 ? "space" : "spaces"}
          {activeFilters > 0
            ? ` · ${filters.guests} guests${filters.instant ? " · Instant booking" : ""}`
            : " · Sample collection"}
        </p>
        <div key={replay} className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((place, index) => (
            <MotionReveal key={place.id} index={index}>
              <MediaCard
                title={place.title}
                subtitle={place.subtitle}
                image={{ src: place.image, alt: place.alt }}
                href={`#${place.id}`}
                onClick={(event) => {
                  if (
                    (event.target as HTMLElement).closest("a") &&
                    !event.ctrlKey &&
                    !event.metaKey &&
                    !event.shiftKey &&
                    !event.altKey
                  ) {
                    event.preventDefault();
                    detailTrigger.current = (
                      event.target as HTMLElement
                    ).closest("a");
                    setSelectedPlace(place.id);
                  }
                }}
                badge={place.badge}
                metadata={
                  <>
                    <span className="font-semibold">{place.price}</span>{" "}
                    <span className="text-muted-foreground">/ night</span>
                  </>
                }
                action={
                  <FavoriteButton
                    label={`Save ${place.title}`}
                    pressed={saved.includes(place.id)}
                    onPressedChange={(pressed) =>
                      setSaved((current) =>
                        pressed
                          ? [...current, place.id]
                          : current.filter((id) => id !== place.id),
                      )
                    }
                  />
                }
              />
            </MotionReveal>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="grid justify-items-start gap-3 py-12">
            <p>No spaces match these choices.</p>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                setFilters({
                  amenities: [],
                  guests: 2,
                  instant: false,
                  accessible: false,
                });
                setType("all");
                setSearch("");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
      <section
        aria-labelledby="controls-title"
        className="mt-16 grid gap-8 border-t border-border pt-8 lg:grid-cols-2 lg:gap-16"
      >
        <div className="grid content-start gap-3">
          <h2 id="controls-title" className="text-2xl font-semibold">
            Small details.
            <br />
            One shared language.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Measured selection glides. Gentle press feedback. A quiet entrance.
            Each component works on its own, with keyboard access and reduced
            motion built in.
          </p>
        </div>
        <div className="grid gap-6">
          <ChoicesDemo />
          <CounterDemo />
        </div>
      </section>
      <footer className="mt-12 flex flex-wrap justify-between gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
        <span>Shared components / Web React</span>
        <span>Airbnb-inspired · Alleato-owned</span>
      </footer>
      <Dialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setSelectedPlace(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            detailTrigger.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>{detail?.subtitle}</DialogDescription>
          </DialogHeader>
          {detail && (
            <img
              className="aspect-video w-full rounded-xl object-cover"
              src={detail.image}
              alt={detail.alt}
              width={800}
              height={450}
            />
          )}
          <p className="text-sm text-muted-foreground">
            This is a sample detail view. Your app supplies navigation,
            availability and booking.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="h-11">Back to collection</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SegmentsDemo() {
  const [value, setValue] = useState("all");
  return (
    <SegmentedControl
      label="Space type"
      options={types}
      value={value}
      onValueChange={setValue}
    />
  );
}
function ChoicesDemo() {
  const [selected, setSelected] = useState<string[]>(["house"]);
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        {
          id: "house",
          label: "A place to stay",
          description: "Make yourself at home",
          icon: <House />,
        },
        {
          id: "experience",
          label: "A moment away",
          description: "Find something new",
          icon: <Waves />,
        },
      ].map((choice) => (
        <SelectionCard
          key={choice.id}
          {...choice}
          selected={selected.includes(choice.id)}
          onSelectedChange={(pressed) =>
            setSelected((current) =>
              pressed
                ? [...current, choice.id]
                : current.filter((id) => id !== choice.id),
            )
          }
        />
      ))}
    </div>
  );
}
function CounterDemo() {
  const [value, setValue] = useState(2);
  return (
    <QuantityStepper
      label="Guests"
      description="A little room for everyone"
      value={value}
      onValueChange={setValue}
      max={5}
    />
  );
}
function FavoriteDemo() {
  const [pressed, setPressed] = useState(false);
  return (
    <FavoriteButton
      label="Save to collection"
      pressed={pressed}
      onPressedChange={setPressed}
    />
  );
}

const padded = { layout: "padded" };
export const Collection: Story = { render: () => <Workbench /> };
export const Segments: Story = {
  parameters: padded,
  render: () => <SegmentsDemo />,
};
export const Choices: Story = {
  parameters: padded,
  render: () => (
    <div className="max-w-lg">
      <ChoicesDemo />
      <div className="mt-4">
        <SelectionCard
          label="Coming soon"
          icon={<Building2 />}
          description="Unavailable selection"
          disabled
          selected={false}
          onSelectedChange={() => {}}
        />
      </div>
    </div>
  ),
};
export const Counter: Story = {
  parameters: padded,
  render: () => (
    <div className="max-w-md">
      <CounterDemo />
    </div>
  ),
};
export const Favorite: Story = {
  parameters: padded,
  render: () => <FavoriteDemo />,
};
export const Cards: Story = {
  parameters: padded,
  render: () => (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <MediaCard
        title="The courtyard house"
        image={{ src: interior, alt: "A sunlit living room" }}
        href="#sample-detail"
        badge="Guest favorite"
        action={<FavoriteDemo />}
      />
      <MediaCard
        title="Image unavailable"
        subtitle="The content remains accessible."
        image={{ src: "data:image/png;base64,broken", alt: "A woodland cabin" }}
        href="#sample-detail"
      />
    </div>
  ),
};
export const Reveal: Story = {
  parameters: padded,
  render: () => (
    <div className="grid max-w-xl gap-3">
      {["Considered", "Connected", "Consistent"].map((label, index) => (
        <MotionReveal
          key={label}
          index={index}
          className="rounded-xl bg-muted p-6 text-lg font-medium"
        >
          {label}
        </MotionReveal>
      ))}
    </div>
  ),
};
