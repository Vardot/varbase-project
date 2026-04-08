import type { Preview } from '@storybook/server'

/**
 * Returns the Drupal base URL (no trailing slash, port included only when non-443).
 *
 * Priority:
 * 1. STORYBOOK_SERVER_URL — injected at webpack build/dev time from .env.storybook,
 *    written by the DDEV post-start hook using DDEV_PRIMARY_URL_WITHOUT_PORT and
 *    DDEV_ROUTER_HTTPS_PORT. Port is omitted when it equals 443.
 *    - DDEV only (port 443):       https://myproject.ddev.site
 *    - Local LAMP + DDEV (8443):   https://myproject.ddev.site:8443
 * 2. Dynamic runtime fallback via window.location (appends :8443 for non-localhost).
 * 3. http://localhost — last resort.
 */
function getServerBase(): string {
  if (typeof process !== 'undefined' && process.env['STORYBOOK_SERVER_URL']) {
    return process.env['STORYBOOK_SERVER_URL'];
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `https://${hostname}:8443`;
    }
  }
  return 'http://localhost';
}

/**
 * Returns the Drupal Storybook render endpoint URL.
 * STORYBOOK_SERVER_RENDER_URL is written by the DDEV post-start hook with the
 * correct port included.
 */
function getServerRenderUrl(): string {
  if (typeof process !== 'undefined' && process.env['STORYBOOK_SERVER_RENDER_URL']) {
    return process.env['STORYBOOK_SERVER_RENDER_URL'];
  }
  return `${getServerBase()}/storybook/stories/render`;
}

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
    const drupalBase = getServerBase();
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
      // Drupal Storybook render endpoint. The URL + port are set at build/dev time
      // via STORYBOOK_SERVER_RENDER_URL written by the DDEV post-start hook.
      url: getServerRenderUrl(),
      // Custom fetch: rewrites relative Drupal asset paths to absolute URLs so
      // CSS, JS and fonts load from Drupal's port, not Storybook's port.
      fetchStoryHtml,
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
