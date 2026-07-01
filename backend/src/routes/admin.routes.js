const router = require('express').Router();
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const authValidation = require('../validations/auth.validation');
const av = require('../validations/admin.validation');
const authController = require('../controllers/auth.controller');
const admin = require('../controllers/admin.controller');

// ---- Admin auth (public) ----
// POST /api/admin/auth/login
router.post('/auth/login', validate(authValidation.login), authController.adminLogin);

// ---- Everything below requires an authenticated admin ----
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', admin.dashboard);

// Crops
router.get('/crops', admin.listCrops);
router.post('/crops', validate(av.createCrop), admin.createCrop);
router.put('/crops/:id', validate(av.updateCrop), admin.updateCrop);
router.delete('/crops/:id', validate(av.idParam), admin.deleteCrop);

// Stages
router.get('/stages', admin.listStages);
router.post('/stages', validate(av.createStage), admin.createStage);
router.put('/stages/:id', validate(av.updateStage), admin.updateStage);
router.delete('/stages/:id', validate(av.idParam), admin.deleteStage);

// Diseases
router.get('/diseases', admin.listDiseases);
router.post('/diseases', validate(av.createDisease), admin.createDisease);
router.put('/diseases/:id', validate(av.updateDisease), admin.updateDisease);
router.delete('/diseases/:id', validate(av.idParam), admin.deleteDisease);

// Disease rules
router.get('/disease-rules', admin.listDiseaseRules);
router.post('/disease-rules', validate(av.createDiseaseRule), admin.createDiseaseRule);
router.put('/disease-rules/:id', validate(av.updateDiseaseRule), admin.updateDiseaseRule);
router.delete('/disease-rules/:id', validate(av.idParam), admin.deleteDiseaseRule);

// Risk levels
router.get('/risk-levels', admin.listRiskLevels);
router.post('/risk-levels', validate(av.createRiskLevel), admin.createRiskLevel);
router.put('/risk-levels/:id', validate(av.updateRiskLevel), admin.updateRiskLevel);
router.delete('/risk-levels/:id', validate(av.idParam), admin.deleteRiskLevel);

// Nutrient rules
router.get('/nutrient-rules', admin.listNutrientRules);
router.post('/nutrient-rules', validate(av.createNutrientRule), admin.createNutrientRule);
router.put('/nutrient-rules/:id', validate(av.updateNutrientRule), admin.updateNutrientRule);
router.delete('/nutrient-rules/:id', validate(av.idParam), admin.deleteNutrientRule);

// Farmers
router.get('/farmers', admin.listFarmers);
router.get('/farmers/:id', validate(av.idParam), admin.getFarmer);
router.delete('/farmers/:id', validate(av.idParam), admin.deleteFarmer);

// Fields
router.get('/fields', admin.listAllFields);
router.get('/fields/:id', validate(av.idParam), admin.getFieldDetails);
router.delete('/fields/:id', validate(av.idParam), admin.deleteField);

module.exports = router;
