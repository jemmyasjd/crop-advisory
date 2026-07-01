const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const fieldService = require('../services/field.service');

const create = asyncHandler(async (req, res) => {
  const field = await fieldService.createField(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: 'Field created and weather synced',
    data: field,
  });
});

const list = asyncHandler(async (req, res) => {
  const fields = await fieldService.listFields(req.user.id);
  return success(res, { message: 'Fields fetched', data: fields });
});

const getOne = asyncHandler(async (req, res) => {
  const field = await fieldService.getField(req.params.fieldId, req.user.id);
  return success(res, { message: 'Field fetched', data: field });
});

const update = asyncHandler(async (req, res) => {
  const field = await fieldService.updateField(
    req.params.fieldId,
    req.user.id,
    req.body
  );
  return success(res, { message: 'Field updated', data: field });
});

const remove = asyncHandler(async (req, res) => {
  await fieldService.deleteField(req.params.fieldId, req.user.id);
  return success(res, { message: 'Field deleted' });
});

module.exports = { create, list, getOne, update, remove };
