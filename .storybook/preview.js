import { withRootAttribute } from "storybook-addon-root-attribute";
export const decorators = [withRootAttribute];

export const globalTypes = {
  rtlDirection: {
    description: 'HTML dir attribute',
    defaultValue: '',
  },
};

/** @type { import('@storybook/server').Preview } */
const preview = {
  globals: {
    drupalTheme: 'vartheme_bs5',
    supportedDrupalThemes: {
      vartheme_bs5: {title: 'Vartheme BS5'},
      // Uncomment the following line to be able to switch to see components for a custom theme.
      // Change `mytheme` to the name of the custom theme.
      // -----------------------------------------------------
      // mytheme: {title: 'My Custom Theme for a Project'}
    },
  },
  parameters: {
    server: {
      // Replace this with your Drupal site URL, or an environment variable.
      url: 'http://varbase.local',
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    // Uncomment the following line to show components in the center of the canvas.
    // layout: 'centered',
    // ------------------------------------
    // Switch off default Storybook backgrounds, To switch to use Bootstrap 5.3.0 theme color mode.
    backgrounds: {
      disable: true,
    },
    // -------------------------------------
    // Add data-bs-theme="dark" to the body the inner iframe in the canvas.
    // Color modes:
    // Bootstrap now supports color modes, or themes, as of v5.3.0.
    // Explore our default light color mode and the new dark mode,
    // or create your own using our styles as your template.
    // https://getbootstrap.com/docs/5.3/customize/color-modes/
    rootAttribute: {
      tooltip: true,
      root: "body",
      attribute: "data-bs-theme",
      defaultState: {
        name: 'Bootstrap 5.3.0 Light Color Mode (Default)',
        value: null
      },
      states: [
        {
          name: 'Bootstrap 5.3.0 Dark Color Mode',
          value: 'dark'
        }
      ],
    },
  },
};

export default preview;

