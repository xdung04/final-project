import * as request from "~/apis/configs/httpRequest";

export const fetchBarberSalaries = async (month, year) => {
  try {
    return await request.get(`/salary`, { params: { month, year } });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchSalaryOverview = async () => {
  try {
    return await request.get(`/salary/overview`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createDraftSalaries = async (month, year) => {
  try {
    return await request.post(`/salary/draft`, { month, year });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendPayslip = async (idSalary) => {
  try {
    return await request.post(`/salary/${idSalary}/send`);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addDeduction = async (idSalary, { amount, reason }) => {
  try {
    return await request.post(`/salary/${idSalary}/deductions`, { amount, reason });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const removeDeduction = async (idDeduction, deleteReason) => {
  try {
    return await request.delete(`/salary/deductions/${idDeduction}`, { data: { deleteReason } });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const forceCloseDispute = async (idSalary, reason) => {
  try {
    return await request.post(`/salary/${idSalary}/force-close`, { reason });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const markAsPaid = async (idSalary, payload) => {
  try {
    return await request.post(`/salary/${idSalary}/pay`, payload);
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const fetchMyPayslips = async (accessToken) => {
  try {
    return await request.get(`/salary/my-payslips`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const confirmMyPayslip = async (idSalary, accessToken) => {
  try {
    return await request.patch(`/salary/${idSalary}/confirm`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const disputeMyPayslip = async (idSalary, reason, accessToken) => {
  try {
    return await request.patch(`/salary/${idSalary}/dispute`, { reason }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    throw error.response?.data || error;
  }
};