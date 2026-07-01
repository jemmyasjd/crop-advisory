const ApiError = require('../utils/ApiError');

/**
 * Joi validation middleware factory.
 * Validates `req.body`, `req.params`, and/or `req.query` against the provided
 * schemas, strips unknown keys, and replaces the request value with the
 * coerced/validated result. Aggregates all errors (abortEarly:false).
 *
 * Usage:
 *   router.post('/x', validate({ body: createXSchema }), controller.createX)
 *
 * @param {{body?:Joi.Schema, params?:Joi.Schema, query?:Joi.Schema}} schemas
 */
function validate(schemas) {
  return (req, _res, next) => {
    const errors = [];

    for (const key of ['body', 'params', 'query']) {
      if (!schemas[key]) continue;
      const { value, error } = schemas[key].validate(req[key], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      });
      if (error) {
        for (const d of error.details) {
          errors.push({ in: key, field: d.path.join('.'), message: d.message });
        }
      } else {
        // express 5: req.query is a getter-only proxy; assign field-by-field.
        if (key === 'query') {
          for (const k of Object.keys(req.query)) delete req.query[k];
          Object.assign(req.query, value);
        } else {
          req[key] = value;
        }
      }
    }

    if (errors.length) {
      return next(ApiError.badRequest('Validation failed', errors));
    }
    next();
  };
}

module.exports = validate;
