const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const svc = require('../services/admin.service');

/** Helper to wrap a service list/get call into a success response. */
const ok = (msg) => (fn) =>
  asyncHandler(async (req, res) => {
    const data = await fn(req);
    return success(res, { message: msg, data });
  });

const created = (msg) => (fn) =>
  asyncHandler(async (req, res) => {
    const data = await fn(req);
    return success(res, { statusCode: 201, message: msg, data });
  });

module.exports = {
  // Dashboard
  dashboard: ok('Dashboard stats')(() => svc.dashboard()),

  // Crops
  listCrops: ok('Crops')(() => svc.listCrops()),
  createCrop: created('Crop created')((req) => svc.createCrop(req.body)),
  updateCrop: ok('Crop updated')((req) => svc.updateCrop(req.params.id, req.body)),
  deleteCrop: ok('Crop deleted')((req) => svc.deleteCrop(req.params.id)),

  // Stages
  listStages: ok('Stages')(() => svc.listStages()),
  createStage: created('Stage created')((req) => svc.createStage(req.body)),
  updateStage: ok('Stage updated')((req) => svc.updateStage(req.params.id, req.body)),
  deleteStage: ok('Stage deleted')((req) => svc.deleteStage(req.params.id)),

  // Diseases
  listDiseases: ok('Diseases')(() => svc.listDiseases()),
  createDisease: created('Disease created')((req) => svc.createDisease(req.body)),
  updateDisease: ok('Disease updated')((req) => svc.updateDisease(req.params.id, req.body)),
  deleteDisease: ok('Disease deleted')((req) => svc.deleteDisease(req.params.id)),

  // Disease rules
  listDiseaseRules: ok('Disease rules')(() => svc.listDiseaseRules()),
  createDiseaseRule: created('Rule created')((req) => svc.createDiseaseRule(req.body)),
  updateDiseaseRule: ok('Rule updated')((req) => svc.updateDiseaseRule(req.params.id, req.body)),
  deleteDiseaseRule: ok('Rule deleted')((req) => svc.deleteDiseaseRule(req.params.id)),

  // Risk levels
  listRiskLevels: ok('Risk levels')(() => svc.listRiskLevels()),
  createRiskLevel: created('Level created')((req) => svc.createRiskLevel(req.body)),
  updateRiskLevel: ok('Level updated')((req) => svc.updateRiskLevel(req.params.id, req.body)),
  deleteRiskLevel: ok('Level deleted')((req) => svc.deleteRiskLevel(req.params.id)),

  // Nutrient rules
  listNutrientRules: ok('Nutrient rules')(() => svc.listNutrientRules()),
  createNutrientRule: created('Nutrient rule created')((req) => svc.createNutrientRule(req.body)),
  updateNutrientRule: ok('Nutrient rule updated')((req) => svc.updateNutrientRule(req.params.id, req.body)),
  deleteNutrientRule: ok('Nutrient rule deleted')((req) => svc.deleteNutrientRule(req.params.id)),

  // Farmers
  listFarmers: ok('Farmers')(() => svc.listFarmers()),
  getFarmer: ok('Farmer details')((req) => svc.getFarmer(req.params.id)),
  deleteFarmer: ok('Farmer deleted')((req) => svc.deleteFarmer(req.params.id)),

  // Fields
  listAllFields: ok('Fields')(() => svc.listAllFields()),
  getFieldDetails: ok('Field details')((req) => svc.getFieldDetails(req.params.id)),
  deleteField: ok('Field deleted')((req) => svc.deleteFieldAdmin(req.params.id)),
};
