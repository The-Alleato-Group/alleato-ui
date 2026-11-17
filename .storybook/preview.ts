import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";
import "./preview.css";

export default {
  decorators: [
    withThemeByClassName({
      themes: { Light: "", Dark: "dark" },
      defaultTheme: "Light",
    }),
  ],
  parameters: {
    layout: "padded",
    controls: { sort: "requiredFirst" },
    options: {
      storySort: {
        order: ["Start here", "Premium", "Components", "Patterns", "Layouts", "Tables"],
      },
    },
  },
} satisfies Preview;
