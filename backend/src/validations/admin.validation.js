const Joi = require('joi');

const idParam = {
  params: Joi.object({ id: Joi.number().integer().positive().required() }),
};
const cropIdParam = {
  params: Joi.object({ cropId: Joi.number().integer().positive().required() }),
};

// ---- Crop ----
const createCrop = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    baseTemperature: Joi.number().required(),
  }),
};
const updateCrop = {
  params: idParam.params,
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    baseTemperature: Joi.number().optional(),
  }).min(1),
};

// ---- Stage ----
const createStage = {
  body: Joi.object({
    cropId: Joi.number().integer().positive().required(),
    stageName: Joi.string().trim().min(1).max(150).required(),
    gddStart: Joi.number().integer().min(0).required(),
    gddEnd: Joi.number().integer().min(0).required(),
    sortOrder: Joi.number().integer().min(0).optional(),
  }),
};
const updateStage = {
  params: idParam.params,
  body: Joi.object({
    stageName: Joi.string().trim().min(1).max(150).optional(),
    gddStart: Joi.number().integer().min(0).optional(),
    gddEnd: Joi.number().integer().min(0).optional(),
    sortOrder: Joi.number().integer().min(0).optional(),
  }).min(1),
};

// ---- Disease ----
const createDisease = {
  body: Joi.object({
    cropId: Joi.number().integer().positive().required(),
    diseaseName: Joi.string().trim().min(1).max(150).required(),
    description: Joi.string().trim().optional().allow('', null),
  }),
};
const updateDisease = {
  params: idParam.params,
  body: Joi.object({
    diseaseName: Joi.string().trim().min(1).max(150).optional(),
    description: Joi.string().trim().optional().allow('', null),
  }).min(1),
};

// ---- Disease rule ----
const operators = ['BETWEEN', 'GTE', 'LTE', 'GT', 'LT', 'EQ'];
const createDiseaseRule = {
  body: Joi.object({
    diseaseId: Joi.number().integer().positive().required(),
    ruleName: Joi.string().trim().max(100).optional(),
    parameter: Joi.string().trim().max(100).required(),
    operator: Joi.string().uppercase().valid(...operators).required(),
    minValue: Joi.number().optional().allow(null),
    maxValue: Joi.number().optional().allow(null),
    consecutiveDays: Joi.number().integer().min(1).optional().allow(null),
    score: Joi.number().integer().required(),
  }),
};
const updateDiseaseRule = {
  params: idParam.params,
  body: Joi.object({
    ruleName: Joi.string().trim().max(100).optional(),
    parameter: Joi.string().trim().max(100).optional(),
    operator: Joi.string().uppercase().valid(...operators).optional(),
    minValue: Joi.number().optional().allow(null),
    maxValue: Joi.number().optional().allow(null),
    consecutiveDays: Joi.number().integer().min(1).optional().allow(null),
    score: Joi.number().integer().optional(),
  }).min(1),
};

// ---- Risk level ----
const createRiskLevel = {
  body: Joi.object({
    diseaseId: Joi.number().integer().positive().required(),
    minScore: Joi.number().integer().required(),
    maxScore: Joi.number().integer().required(),
    riskLevel: Joi.string().trim().max(20).required(),
    advisory: Joi.string().trim().required(),
  }),
};
const updateRiskLevel = {
  params: idParam.params,
  body: Joi.object({
    minScore: Joi.number().integer().optional(),
    maxScore: Joi.number().integer().optional(),
    riskLevel: Joi.string().trim().max(20).optional(),
    advisory: Joi.string().trim().optional(),
  }).min(1),
};

// ---- Nutrient rule ----
const createNutrientRule = {
  body: Joi.object({
    cropId: Joi.number().integer().positive().required(),
    stageId: Joi.number().integer().positive().required(),
    season: Joi.string().trim().max(50).optional().allow('', null),
    nutrient: Joi.string().trim().max(50).required(),
    fertilizer: Joi.string().trim().max(150).required(),
    soilThreshold: Joi.number().required(),
    doseUnderThreshold: Joi.number().required(),
    doseAboveThreshold: Joi.number().required(),
  }),
};
const updateNutrientRule = {
  params: idParam.params,
  body: Joi.object({
    stageId: Joi.number().integer().positive().optional(),
    season: Joi.string().trim().max(50).optional().allow('', null),
    nutrient: Joi.string().trim().max(50).optional(),
    fertilizer: Joi.string().trim().max(150).optional(),
    soilThreshold: Joi.number().optional(),
    doseUnderThreshold: Joi.number().optional(),
    doseAboveThreshold: Joi.number().optional(),
  }).min(1),
};

module.exports = {
  idParam,
  cropIdParam,
  createCrop,
  updateCrop,
  createStage,
  updateStage,
  createDisease,
  updateDisease,
  createDiseaseRule,
  updateDiseaseRule,
  createRiskLevel,
  updateRiskLevel,
  createNutrientRule,
  updateNutrientRule,
};
