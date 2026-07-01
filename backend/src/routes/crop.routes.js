const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const adminValidation = require('../validations/admin.validation');
const cropController = require('../controllers/crop.controller');

router.use(authenticate);

// GET /api/crops
router.get('/', cropController.getCrops);

// GET /api/crops/:cropId/stages
router.get(
  '/:cropId/stages',
  validate(adminValidation.cropIdParam),
  cropController.getStages
);

// GET /api/crops/:cropId/diseases
router.get(
  '/:cropId/diseases',
  validate(adminValidation.cropIdParam),
  cropController.getDiseases
);

module.exports = router;
