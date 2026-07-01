const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const soilService = require('../services/soilReport.service');

const create = asyncHandler(async (req, res) => {
  const report = await soilService.createReport(
    req.params.fieldId,
    req.user.id,
    req.body
  );
  return success(res, {
    statusCode: 201,
    message: 'Soil report uploaded',
    data: report,
  });
});

const latest = asyncHandler(async (req, res) => {
  const report = await soilService.getLatest(req.params.fieldId, req.user.id);
  return success(res, { message: 'Latest soil report', data: report });
});

const history = asyncHandler(async (req, res) => {
  const reports = await soilService.getHistory(req.params.fieldId, req.user.id);
  return success(res, { message: 'Soil report history', data: reports });
});

const remove = asyncHandler(async (req, res) => {
  await soilService.deleteReport(req.params.id, req.user.id);
  return success(res, { message: 'Soil report deleted' });
});

module.exports = { create, latest, history, remove };
