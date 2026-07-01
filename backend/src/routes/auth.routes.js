const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const authValidation = require('../validations/auth.validation');
const authController = require('../controllers/auth.controller');

// POST /api/auth/signup
router.post('/signup', validate(authValidation.signup), authController.signup);

// POST /api/auth/login
router.post('/login', validate(authValidation.login), authController.login);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;
