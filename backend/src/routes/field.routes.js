const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const fieldValidation = require('../validations/field.validation');
const soilValidation = require('../validations/soilReport.validation');
const fieldController = require('../controllers/field.controller');
const soilController = require('../controllers/soilReport.controller');
const advisoryController = require('../controllers/advisory.controller');

router.use(authenticate);

// ---- Fields ----
router.post('/', validate(fieldValidation.create), fieldController.create);
router.get('/', fieldController.list);
router.get('/:fieldId', validate(fieldValidation.idParam), fieldController.getOne);
router.put('/:fieldId', validate(fieldValidation.update), fieldController.update);
router.delete('/:fieldId', validate(fieldValidation.idParam), fieldController.remove);

// ---- Soil reports (nested under field) ----
router.post(
  '/:fieldId/soil-reports',
  validate(soilValidation.create),
  soilController.create
);
router.get(
  '/:fieldId/soil-reports/latest',
  validate(soilValidation.fieldIdParam),
  soilController.latest
);
router.get(
  '/:fieldId/soil-reports',
  validate(soilValidation.fieldIdParam),
  soilController.history
);

// ---- Advisory ----
router.get(
  '/:fieldId/advisory',
  validate(fieldValidation.idParam),
  advisoryController.generate
);
router.get(
  '/:fieldId/advisories',
  validate(fieldValidation.idParam),
  advisoryController.history
);
router.delete(
  '/:fieldId/advisories/:advisoryId',
  validate(fieldValidation.advisoryIdParam),
  advisoryController.remove
);

module.exports = router;
