const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const profileService = require('../services/profile.service');

const getProfile = asyncHandler(async (req, res) => {
  const user = await profileService.getProfile(req.user.id);
  return success(res, { message: 'Profile fetched', data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile(req.user.id, req.body);
  return success(res, { message: 'Profile updated', data: user });
});

module.exports = { getProfile, updateProfile };
