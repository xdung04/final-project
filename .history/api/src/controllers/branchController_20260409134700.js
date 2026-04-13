import branchService from "../services/branchService.js";

export const createBranch = async (req, res) => {
  try {
    const branch = await branchService.createBranch(req.body);
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatedBranch = await branchService.updateBranch(id, data);

    res.json({
      success: true,
      message: "Cập nhật chi nhánh thành công!",
      branch: updatedBranch,
    });
  } catch (error) {
    console.error("Lỗi updateBranch controller:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Lỗi khi cập nhật chi nhánh!",
    });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    await branchService.deleteBranch(req.params.id);
    res.json({ message: "Branch deleted" });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};


export const getAllBranches = async (req, res) => {
  try {
    const branches = await branchService.getAllBranches();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const syncBranchesToPinecone = async (req, res) => {
  try {
    const result = await branchService.syncBranchesToPinecone();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setSuspendDate = async (req, res) => {
  try {
    const branchId = req.params.id;
    const { suspendDate } = req.body;

    const result = await branchService.setSuspendDate(branchId, suspendDate);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
export const setResumeDate = async (req, res) => {
  try {
     console.log("🔽 RESUME API HIT");
    console.log("params.id =", req.params.id);
    console.log("req.body =", req.body);
    console.log("resumeDate =", req.body.resumeDate, typeof req.body.resumeDate);

    const branchId = req.params.id;
    const { resumeDate } = req.body;

    const result = await branchService.setResumeDate(branchId, resumeDate);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
