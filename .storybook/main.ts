import type { StorybookConfig } from '@storybook/server-webpack5';

const config: StorybookConfig = {
  // Change the place where storybook searched for stories.
  "stories": [
    // -------------------------------------------------------------------------------
    // Listing components Vartheme BS5 Starterkit. ( Comment when using a custom theme for a project)
    "../web/themes/contrib/vartheme_bs5/components/**/*.mdx",
    "../web/themes/contrib/vartheme_bs5/components/**/*.stories.@(json)",
    // -------------------------------------------------------------------------------
    // Uncomment the following line to start listing components from custom cloned generated theme
    // Change `mytheme` to the name of the custom theme.
    // "../web/themes/custom/mytheme/components/**/*.mdx",
    // "../web/themes/custom/mytheme/components/**/*.stories.@(json)",
    // -------------------------------------------------------------------------------
    // Uncomment the following line to start listing components from custom modules
    // "../web/modules/custom/my_custom_module/components/**/*.mdx",
    // "../web/modules/custom/my_custom_module/components/**/*.stories.@(json)",
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-webpack5-compiler-swc",
    "@chromatic-com/storybook"
  ],
  "framework": {
    "name": "@storybook/server-webpack5",
    "options": {}
  },
  core: {
    builder: "@storybook/builder-webpack5",
    disableTelemetry: true, // Disables telemetry https://storybook.js.org/telemetry
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: [
    {
      from: "../web/themes/contrib/vartheme_bs5/components",
      to: "/components",
    },
  ],
};
export default config;
