const Joi = require('joi');

const updateProfile = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().trim().max(20).optional().allow('', null),
    password: Joi.string().min(6).max(128).optional(),
  }).min(1),
};

module.exports = { updateProfile };
