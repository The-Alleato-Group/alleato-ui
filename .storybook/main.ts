import tailwindcss from "@tailwindcss/vite";
import type { StorybookConfig } from "@storybook/nextjs-vite";

export default {
  framework: "@storybook/nextjs-vite",
  stories: ["../stories/**/*.stories.tsx"],
  features: {
    backgrounds: false,
    sidebarOnboardingChecklist: false,
    menuOnboardingChecklist: false,
  },
  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],
  viteFinal: (config) => ({
    ...config,
    plugins: [...(config.plugins ?? []), tailwindcss()],
  }),
} satisfies StorybookConfig;
