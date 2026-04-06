import type { Preview } from '@storybook/server'

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Getting Started', ['Welcome', 'About Varbase'],
          'Foundation', [
            'Colors',
            'Icons',
            'Images',
            'Interaction Guideline',
            'Logos',
            'Spacing & Grids',
            'Typography',
            '*'
          ],
          'Base', [
            'Anchor',
            'Badge',
            'Blockquote',
            'Heading',
            'HTML Code',
            'Icon',
            'Plain Text',
            'Rich Text',
            'Taxonomy',
            'Text',
            '*'
          ],
          'Hero', [
            'Hero Billboard',
            'Hero Blog',
            'Hero Card',
            'Hero Heroslider',
            'Hero Side by Side',
            'Hero Slider Container',
            '*'
          ],
          'Layout', [
            'Column',
            'Group',
            'Horizontal Ruler',
            'Row',
            'Section',
            'Spacer',
            '*'
          ],
          'Cards', [
            'Card',
            'Card Icon',
            'Card Logo',
            'Card Overlay',
            'Featured Card',
            'Hero Card',
            'Impressed Card',
            'Pricing card',
            'Testimonial Card',
            'Text Card',
            '*'
          ],
          'Atoms', [
            'Button',
            'Close Button',
            'Image',
            'Input',
            'Input Checkbox',
            'Input Submit',
            'Link',
            'List',
            'Page Title',
            'Progress Bar',
            'Spinner',
            'Textarea',
            '*'
          ],
          'Molecules', [
            'Accordion',
            'Alert',
            'Breadcrumb',
            'Callout',
            'Field tags',
            'Grid',
            'List Group',
            'Pagination',
            'Table',
            '*'
          ],
          'Organisms', [
            'Carousel',
            'CTA',
            'Heroslider',
            'Media Header',
            'Navbar',
            'View Grid',
            'View Heroslider',
            'View List',
            'View Summary',
            'View Table',
            '*'
          ],
        ],
      }
    },
    server: {
      // Replace this with your Drupal site URL, or an environment variable.
      url: getServerUrl(),
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
