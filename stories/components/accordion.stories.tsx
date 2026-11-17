import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@alleato/ui/components/accordion";

const meta = {
  title: "Components/Accordion",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion
      type="single"
      collapsible
      defaultValue="scope"
      className="max-w-lg"
    >
      <AccordionItem value="scope">
        <AccordionTrigger>Scope of work</AccordionTrigger>
        <AccordionContent>
          Install the new riser and pressure test the system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="access">
        <AccordionTrigger>Site access</AccordionTrigger>
        <AccordionContent>
          Use the east loading gate after 7 a.m.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
