import type { Preview } from '@storybook/server'

const preview: Preview = {
  parameters: {
    server: {
      // Replace this with your Drupal site URL, or an environment variable.
      url: process.env.STORYBOOK_SERVER_RENDER_URL,
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // Uncomment the following line to show components in the center of the canvas.
    // layout: 'centered',
    // ------------------------------------
    // Switch off default Storybook backgrounds, To switch to use Bootstrap theme color mode.
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
    rootAttributesTooltip: true,
    rootAttributes: [
      {
        root: "body",
        attribute: "data-bs-theme",
        defaultState: {
          name: "Light",
          value: null,
        },
        states: [
          {
            name: "Dark",
            value: "dark",
          }
        ],
      },
      {
        root: "html",
        attribute: "dir",
        defaultState: {
          name: "LTR",
          value: "ltr",
        },
        states: [
          {
            name: "RTL",
            value: "rtl",
          },
        ],
      },
    ],
  },
};

export default preview;