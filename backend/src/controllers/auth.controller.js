const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const authService = require('../services/auth.service');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  return success(res, {
    statusCode: 201,
    message: 'Signup successful',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, 'farmer');
  return success(res, { message: 'Login successful', data: result });
});

const adminLogin = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, 'admin');
  return success(res, { message: 'Admin login successful', data: result });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  return success(res, { message: 'Logged out successfully' });
});

module.exports = { signup, login, adminLogin, logout };
