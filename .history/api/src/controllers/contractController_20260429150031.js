import {
  getContractByBarberId,
  getContractHistoryByBarberId,
} from "../services/salaryContract.service.js";

/**
 * GET /api/contracts/my-contract
 * Lấy hợp đồng active hiện tại (dùng cho trang in hợp đồng)
 */
export const getMyContract = async (req, res) => {
  try {
    const idBarber = req.user.idUser; // ✅ Lấy từ JWT

    const contract = await getContractByBarberId(idBarber);

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/contracts/my-history
 * Lấy toàn bộ lịch sử hợp đồng (dùng cho trang danh sách)
 */
export const getMyContractHistory = async (req, res) => {
  try {
    const idBarber = req.user.idUser; // ✅ Lấy từ JWT

    const contracts = await getContractHistoryByBarberId(idBarber);

    return res.status(200).json({
      success: true,
      total: contracts.length,
      data: contracts,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};