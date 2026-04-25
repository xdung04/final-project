import { getBranchByReceptionist } from "../services/receptionistService.js";

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
