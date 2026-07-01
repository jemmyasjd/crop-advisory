const router = require('express').Router();
const openapiSpec = require('../docs/openapi');

// ---- API documentation ----
// Raw OpenAPI JSON.
router.get('/docs.json', (_req, res) => res.json(openapiSpec));

// Swagger UI served as a self-contained HTML page that loads assets from a CDN.
// (swagger-ui-express serves its assets from the local filesystem, which does not
// resolve on Vercel's serverless functions — that yields a blank page in prod.)
router.get('/docs', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Crop Advisory API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: './docs.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
      });
    };
  </script>
</body>
</html>`);
});

router.use('/auth', require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/fields', require('./field.routes'));
router.use('/soil-reports', require('./soilReport.routes'));
router.use('/crops', require('./crop.routes'));
router.use('/admin', require('./admin.routes'));

// Health check
router.get('/health', (_req, res) =>
  res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() })
);

module.exports = router;
