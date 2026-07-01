const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('../docs/openapi');

// API documentation (Swagger UI + raw OpenAPI JSON)
router.get('/docs.json', (_req, res) => res.json(openapiSpec));
router.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, { customSiteTitle: 'Crop Advisory API Docs' })
);

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
