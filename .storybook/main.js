/** @type { import('@storybook/server-webpack5').StorybookConfig } */
const config = {
  // Change the place where storybook searched for stories.
  stories: [
    // Uncomment the following line to start listing Vartheme BS5 components.
    // "../docroot/themes/contrib/vartheme_ba5/components/**/*.stories.@(json|yml)",
    // Listing Varbase Components in the Storybook
    "../docroot/modules/contrib/varbase_components/components/**/*.stories.@(json|yml)",
    // Uncomment the following line to start listing custom Vartheme components
    // "../docroot/themes/contrib/vartheme_ba5/components/**/*.stories.@(json|yml)",
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@lullabot/storybook-drupal-addon',
    '@storybook/manager-api',
    '@storybook/theming',
    'storybook-addon-root-attribute/register'
  ],
  framework: {
    name: "@storybook/server-webpack5",
    options: {},
  },
  core: {
    builder: '@storybook/builder-webpack5'
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
