const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const soilValidation = require('../validations/soilReport.validation');
const soilController = require('../controllers/soilReport.controller');

router.use(authenticate);

// DELETE /api/soil-reports/:id
router.delete('/:id', validate(soilValidation.idParam), soilController.remove);

module.exports = router;
