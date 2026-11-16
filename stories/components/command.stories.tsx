import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@alleato/ui/components/command";

const meta = {
  title: "Components/Command",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="max-w-sm rounded-md border">
      <CommandInput placeholder="Find an action…" />
      <CommandList>
        <CommandEmpty>No actions match</CommandEmpty>
        <CommandGroup heading="Project actions">
          <CommandItem>
            Open drawings<CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem>Review checklist</CommandItem>
          <CommandItem disabled>Issue report</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
