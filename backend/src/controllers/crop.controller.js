const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const cropService = require('../services/crop.service');

const getCrops = asyncHandler(async (_req, res) => {
  const crops = await cropService.listCrops();
  return success(res, { message: 'Crops fetched', data: crops });
});

const getStages = asyncHandler(async (req, res) => {
  const stages = await cropService.getStages(req.params.cropId);
  return success(res, { message: 'Crop stages fetched', data: stages });
});

const getDiseases = asyncHandler(async (req, res) => {
  const diseases = await cropService.getDiseases(req.params.cropId);
  return success(res, { message: 'Diseases fetched', data: diseases });
});

module.exports = { getCrops, getStages, getDiseases };
