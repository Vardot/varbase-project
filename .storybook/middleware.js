/**
 * Storybook Express middleware for proxying Drupal static assets.
 *
 * Problem: The Storybook iframe runs at :6006, but Drupal assets (CSS, JS,
 * fonts, images) are served from :8443. Browsers block cross-origin
 * sub-resources loaded via innerHTML (no CORS headers on static files).
 *
 * Solution: Proxy all Drupal asset paths through the Storybook dev server
 * so the browser sees them as same-origin (:6006) requests.
 *
 * Proxied paths: /themes/, /modules/, /core/, /libraries/, /sites/, /storybook/
 */

const httpProxy = require('http-proxy');

// Read the Drupal base URL from the env var injected by the DDEV post-start hook
// (written to .env.storybook and loaded by the storybook:dev script).
// Fall back to http://localhost if not set.
function getDrupalBase() {
  const url = process.env.STORYBOOK_SERVER_URL;
  if (url && url.trim()) {
    return url.trim().replace(/\/$/, '');
  }
  return 'http://localhost';
}

const DRUPAL_ASSET_PREFIXES = [
  '/themes/',
  '/modules/',
  '/core/',
  '/libraries/',
  '/sites/',
  '/storybook/',
];

module.exports = function expressMiddleware(app) {
  const drupalBase = getDrupalBase();
  const proxy = httpProxy.createProxyServer({
    target: drupalBase,
    changeOrigin: true,
    secure: false, // allow self-signed certs (DDEV uses its own CA)
    selfHandleResponse: false,
  });

  proxy.on('error', function (err, req, res) {
    console.error('[storybook-proxy] Error proxying', req.url, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    res.end('Proxy error: ' + err.message);
  });

  // Add CORS headers to proxied responses so the browser accepts them.
  proxy.on('proxyRes', function (proxyRes) {
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET, OPTIONS';
  });

  app.use(function (req, res, next) {
    const shouldProxy = DRUPAL_ASSET_PREFIXES.some((prefix) =>
      req.url.startsWith(prefix)
    );
    if (!shouldProxy) {
      return next();
    }
    proxy.web(req, res, { target: drupalBase });
  });
};
