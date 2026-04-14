import * as requestService from "~/services/authService";

export const AuthAPI = {
  login: async ({ email, password }) => {
    const result = await requestService.login({ email, password });
    return result;
  },

  googleLogin: async (token) => {
    // ← MỚI
    const result = await requestService.googleLogin({ token });
    return result;
  },

  register: async ({
    fullName,
    email,
    phoneNumber,
    password,
    confirmPassword,
  }) => {
    const result = await requestService.register({
      fullName,
      email,
      phoneNumber,
      password,
      confirmPassword,
    });
    return result;
  },

  verifyOtp: async ({ email, otp }) => {
    const result = await requestService.verifyOtp({ email, otp });
    return result;
  },

  forgotPassword: async ({ email }) => {
    const result = await requestService.forgotPassword({ email });
    return result;
  },

  verifyForgotOtp: async ({ email, otp }) => {
    const result = await requestService.verifyForgotOtp({ email, otp });
    return result;
  },

  resetPassword: async ({ email, newPassword }) => {
    const result = await requestService.resetPassword({ email, newPassword });
    return result;
  },

  refreshToken: async ({ refreshToken }) => {
    const result = await requestService.refreshToken({ refreshToken });
    return result;
  },

  logout: async ({ refreshToken }) => {
    const result = await requestService.logout({ refreshToken });
    return result;
  },

  getMe: async () => {
  const result = await requestService.getMe();
  return result;
  },

};
