const Joi = require('joi');

// The three Indian cropping seasons supported by the platform.
const SEASONS = ['Rabi', 'Kharif', 'Zaid'];
const season = Joi.string()
  .trim()
  .valid(...SEASONS)
  .messages({ 'any.only': `season must be one of ${SEASONS.join(', ')}` });

const idParam = {
  params: Joi.object({
    fieldId: Joi.number().integer().positive().required(),
  }),
};

const advisoryIdParam = {
  params: Joi.object({
    fieldId: Joi.number().integer().positive().required(),
    advisoryId: Joi.number().integer().positive().required(),
  }),
};

const create = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(150).required(),
    cropId: Joi.number().integer().positive().required(),
    season: season.required(),
    areaHectare: Joi.number().positive().required(),
    plantingDate: Joi.date().iso().required(),
    latitude: Joi.number().min(-90).max(90).optional().allow(null),
    longitude: Joi.number().min(-180).max(180).optional().allow(null),
  }),
};

const update = {
  params: idParam.params,
  body: Joi.object({
    name: Joi.string().trim().min(1).max(150).optional(),
    cropId: Joi.number().integer().positive().optional(),
    season: season.optional(),
    areaHectare: Joi.number().positive().optional(),
    plantingDate: Joi.date().iso().optional(),
    latitude: Joi.number().min(-90).max(90).optional().allow(null),
    longitude: Joi.number().min(-180).max(180).optional().allow(null),
  }).min(1),
};

module.exports = { SEASONS, idParam, advisoryIdParam, create, update };
