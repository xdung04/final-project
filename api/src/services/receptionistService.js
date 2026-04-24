import db from "../models/index.js";

export const getBranchByReceptionist = async (idReceptionist) => {
  const receptionist = await db.Receptionist.findOne({
    where: { idReceptionist },
    include: [
      {
        model: db.Branch,
        as: "branch",
        attributes: ["idBranch", "name", "address", "openTime", "closeTime", "status", "slotDuration"],
      },
    ],
  });

  if (!receptionist) return null;

  return {
    idBranch: receptionist.branch?.idBranch,
    branchName: receptionist.branch?.name,
    branchAddress: receptionist.branch?.address,
    openTime: receptionist.branch?.openTime,
    closeTime: receptionist.branch?.closeTime,
  };
};
