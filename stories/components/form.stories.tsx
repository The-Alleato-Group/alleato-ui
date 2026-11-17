import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@alleato/ui/components/form";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Input } from "@alleato/ui/components/input";
import { Button } from "@alleato/ui/components/button";

function RequiredField() {
  const form = useForm({ defaultValues: { name: "" } });
  const [saved, setSaved] = useState("");
  return (
    <Form {...form}>
      <form
        className="grid max-w-sm gap-3"
        onSubmit={form.handleSubmit(({ name }) => setSaved(name))}
      >
        <FormField
          control={form.control}
          name="name"
          rules={{ required: "Enter an inspection name." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inspection name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Use a short, recognizable name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save inspection</Button>
        {saved && <p role="status">Saved: {saved}</p>}
      </form>
    </Form>
  );
}

const meta = {
  title: "Components/Form",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Validation: Story = { render: RequiredField };
