const asyncHandler = require('../utils/asyncHandler');
const advisoryService = require('../services/advisory.service');

const generate = asyncHandler(async (req, res) => {
  const advisory = await advisoryService.generateAdvisory(
    req.params.fieldId,
    req.user.id,
    true
  );
  return res.status(200).json({
    success: true,
    message: 'Advisory generated successfully',
    generatedAt: new Date().toISOString(),
    ...advisory,
  });
});

const history = asyncHandler(async (req, res) => {
  const items = await advisoryService.getAdvisoryHistory(
    req.params.fieldId,
    req.user.id
  );
  return res.status(200).json({
    success: true,
    message: 'Advisory history fetched',
    data: items,
  });
});

const remove = asyncHandler(async (req, res) => {
  await advisoryService.deleteAdvisory(
    req.params.fieldId,
    req.params.advisoryId,
    req.user.id
  );
  return res.status(200).json({
    success: true,
    message: 'Advisory deleted',
  });
});

module.exports = { generate, history, remove };
