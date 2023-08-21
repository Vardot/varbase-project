/** @type { import('@storybook/server-webpack5').StorybookConfig } */
const config = {
  // Change the place where storybook searched for stories.
  stories: [
    // Listing Varbase Components in the Storybook
    "../docroot/modules/contrib/varbase_components/components/**/*.mdx",
    "../docroot/modules/contrib/varbase_components/components/**/*.stories.@(json|yml)",
    // -------------------------------------------------------------------------------
    // Uncomment the following line to start listing components Vartheme BS5 Starterkit.
    // "../docroot/themes/contrib/vartheme_ba5/components/**/*.mdx",
    // "../docroot/themes/contrib/vartheme_ba5/components/**/*.stories.@(json|yml)",
    // -------------------------------------------------------------------------------
    // Uncomment the following line to start listing components from custom cloned generated theme
    // Change `mytheme` to the name of the custom theme.
    // "../docroot/themes/custom/mytheme/components/**/*.mdx",
    // "../docroot/themes/custom/mytheme/components/**/*.stories.@(json|yml)",
    // -------------------------------------------------------------------------------
    // Uncomment the following line to start listing components from custom modules
    // "../docroot/modules/custom/my_custom_module/components/**/*.mdx",
    // "../docroot/modules/custom/my_custom_module/components/**/*.stories.@(json|yml)",
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@lullabot/storybook-drupal-addon',
    '@storybook/manager-api',
    '@storybook/theming',
    '@storybook/addon-a11y',
    '@storybook/blocks',
    'storybook-addon-root-attribute/register',
    'storybook-addon-rtl-direction'
  ],
  framework: {
    name: "@storybook/server-webpack5",
    options: {},
  },
  core: {
    builder: '@storybook/builder-webpack5',
    disableTelemetry: true, // Disables telemetry https://storybook.js.org/telemetry
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
