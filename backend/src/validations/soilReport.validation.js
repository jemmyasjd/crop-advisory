const Joi = require('joi');

const fieldIdParam = {
  params: Joi.object({
    fieldId: Joi.number().integer().positive().required(),
  }),
};

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

const create = {
  params: fieldIdParam.params,
  body: Joi.object({
    reportDate: Joi.date().iso().optional(),
    nitrogen: Joi.number().min(0).required(),
    phosphorus: Joi.number().min(0).required(),
    potassium: Joi.number().min(0).required(),
    soilMoisture: Joi.number().min(0).max(100).optional().allow(null),
  }),
};

module.exports = { fieldIdParam, idParam, create };
