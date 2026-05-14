import {
  getBranchByReceptionist,
  getReceptionistByBranch,
  updateReceptionistByAdmin,
} from "../services/receptionistService.js";

export const getMyBranch = async (req, res) => {
  try {
    const idReceptionist = req.user.idUser;

    const branch = await getBranchByReceptionist(idReceptionist);

    if (!branch) {
      return res.status(404).json({ message: "Không tìm thấy thông tin lễ tân" });
    }

    return res.status(200).json(branch);
  } catch (error) {
    console.error("Lỗi my-branch:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy thông tin receptionist theo idBranch (dành cho admin)
export const getReceptionistByBranchId = async (req, res) => {
  try {
    const { idBranch } = req.params;

    const receptionist = await getReceptionistByBranch(Number(idBranch));

    if (!receptionist) {
      return res.status(404).json({ message: "Chi nhánh chưa có lễ tân" });
    }

    return res.status(200).json({ success: true, data: receptionist });
  } catch (error) {
    console.error("Lỗi getReceptionistByBranchId:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// Admin cập nhật thông tin receptionist
export const updateReceptionist = async (req, res) => {
  try {
    const { idBranch } = req.params;
    const { fullName, email, phoneNumber, password } = req.body;

    const updated = await updateReceptionistByAdmin(Number(idBranch), {
      fullName,
      email,
      phoneNumber,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin lễ tân thành công",
      data: updated,
    });
  } catch (error) {
    console.error("Lỗi updateReceptionist:", error);
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || "Lỗi server" });
  }
};
