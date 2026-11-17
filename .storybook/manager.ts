import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  layoutCustomisations: {
    showPanel: (state) =>
      state.storyId === "start-here--catalog" ? false : undefined,
  },
  theme: create({
    base: "light",
    brandTitle: "Alleato UI",
    brandUrl: "?path=/story/start-here--catalog",
    colorSecondary: "#be4b22",
  }),
});
