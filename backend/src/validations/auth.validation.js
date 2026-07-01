const Joi = require('joi');

const signup = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(6).max(128).required(),
    phone: Joi.string().trim().max(20).optional().allow('', null),
  }),
};

const login = {
  body: Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().required(),
  }),
};

module.exports = { signup, login };
