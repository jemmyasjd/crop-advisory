const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const profileValidation = require('../validations/profile.validation');
const profileController = require('../controllers/profile.controller');

router.use(authenticate);

// GET /api/profile
router.get('/', profileController.getProfile);

// PUT /api/profile
router.put('/', validate(profileValidation.updateProfile), profileController.updateProfile);

module.exports = router;
