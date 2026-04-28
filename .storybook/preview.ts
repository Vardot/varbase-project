import type { Preview, Decorator } from '@storybook/server'

/**
 * Custom fetch function for @storybook/server.
 *
 * 1. Cleans up params before sending to Drupal:
 *    - Removes undefined/null values (e.g. "attributes=undefined" breaks Drupal SDC validation)
 *    - Converts "#" URI values to "" (Drupal rejects bare "#" as an invalid uri-reference)
 * 2. Rewrites all relative asset paths (href="/...", src="/...") to absolute
 *    URLs pointing to the Drupal server, so CSS/JS load from the correct port
 *    and not from Storybook's port (6006).
 */
async function fetchStoryHtml(
  url: string,
  path: string,
  params: Record<string, unknown>,
): Promise<string> {
  // Clean params: remove undefined/null, fix bare "#" URI values.
  const cleanParams: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === 'undefined' || value === 'null') {
      continue;
    }
    const str = String(value);
    // Drupal SDC rejects "#" as an invalid uri-reference — use empty string instead.
    cleanParams[key] = str === '#' ? '' : str;
  }

  const fetchUrl = new URL(`${url}/${path}`);
  fetchUrl.search = new URLSearchParams(cleanParams).toString();

  const response = await fetch(fetchUrl.toString());
  let html = await response.text();

  // In development, .storybook/middleware.js proxies Drupal asset paths
  // (/themes/, /modules/, /core/, etc.) through the Storybook dev server so
  // the browser loads them same-origin — no CORS issues, no rewriting needed.
  //
  // In production (storybook:build static export), there is no proxy, so
  // rewrite relative root-relative paths to absolute Drupal URLs so that CSS,
  // JS and images load from the Drupal server instead of 404-ing on the
  // static host. Skips protocol-relative "//..." URLs.
  if (process.env.NODE_ENV !== 'development') {
    const drupalBase = new URL(url).origin;
    html = html.replace(
      /(href|src|action)="(\/[^"]*?)"/g,
      (_match, attr, assetPath) => {
        if ((assetPath as string).startsWith('//')) return _match;
        return `${attr}="${drupalBase}${assetPath}"`;
      }
    );
  }

  return html;
}

/**
 * Decorator: applies Bootstrap color mode (data-bs-theme) and text direction (dir)
 * to the preview iframe's <body> and <html> elements based on Storybook globals.
 *
 * Replaces storybook-addon-root-attributes (not compatible with Storybook 10).
 * Toolbar controls are defined via globalTypes below.
 */
const rootAttributesDecorator: Decorator = (storyFn, context) => {
  const { bsTheme, textDir } = context.globals as { bsTheme?: string; textDir?: string };

  if (typeof document !== 'undefined') {
    // Apply Bootstrap color mode to <body>
    if (bsTheme && bsTheme !== 'light') {
      document.body.setAttribute('data-bs-theme', bsTheme);
    } else {
      document.body.removeAttribute('data-bs-theme');
    }

    // Apply text direction to <html>
    document.documentElement.setAttribute('dir', textDir || 'ltr');
  }

  return storyFn();
};

const preview: Preview = {
  // ---------------------------------------------------------------------------
  // Toolbar globals for Bootstrap color mode and text direction.
  // ---------------------------------------------------------------------------
  globalTypes: {
    bsTheme: {
      description: 'Bootstrap color mode (data-bs-theme on <body>)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    textDir: {
      description: 'Text direction (dir attribute on <html>)',
      toolbar: {
        title: 'Direction',
        icon: 'paragraph',
        items: [
          { value: 'ltr', title: 'LTR' },
          { value: 'rtl', title: 'RTL' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    bsTheme: 'light',
    textDir: 'ltr',
  },

  decorators: [rootAttributesDecorator],

  parameters: {
    options: {
      storySort: {
        order: [
          'Getting Started', ['Welcome', 'About Varbase'],
          'Foundation', [
            'Logos',
            'Colors',
            'Typography',
            'Spacing & Grids',
            'Interaction Guideline',
            'Icons',
            'Images',
            '*'
          ],
          'Base', [
            'Anchor',
            'Badge',
            'Blockquote',
            'Button',
            'Heading',
            'Icon',
            'Image',
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
            'Heroslider',
            'Hero Side by Side',
            'Hero Slider Container',
            '*'
          ],
          'Layout', [
            'Accordion',
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
            'Card Text',
            'Featured Card',
            'Hero Card',
            'Impressed Card',
            'Pricing card',
            'Testimonial Card',
            '*'
          ],
          'Atoms', [
            'Close Button',
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
            'Alert',
            'Breadcrumb',
            'Callout',
            'Field tags',
            'Grid',
            'Hero Slide',
            'List Group',
            'Pagination',
            'Table',
            '*'
          ],
          'Organisms', [
            'Carousel',
            'CTA',
            'Navbar',
            '*'
          ],
          'Others', [
            'Bootstrap Icon',
            'HTML Code',
            '*'
          ],
        ],
      }
    },
    server: {
      // Replace this with your Drupal site URL, or an environment variable.
      url: process.env.STORYBOOK_SERVER_RENDER_URL,
      // Custom fetch: cleans params and rewrites Drupal asset paths.
      fetchStoryHtml,
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // Switch off default Storybook backgrounds — Bootstrap color mode is used instead.
    backgrounds: {
      disable: true,
    },
  },
};

export default preview;
