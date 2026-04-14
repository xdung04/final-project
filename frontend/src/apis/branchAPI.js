import * as branchService from "~/services/branchService";

export const BranchAPI = {
  getAll: async () => {
    const result = await branchService.getAllBranches();
    return result;
  },

  create: async (data) => {
    const result = await branchService.createBranch(data);
    return result;
  },

  update: async (id, data) => {
    const result = await branchService.updateBranch(id, data);
    return result;
  },

  delete: async (id) => {
    const result = await branchService.deleteBranch(id);
    return result;
  },

  toggleStatus: async (id) => {
    const result = await branchService.toggleBranchStatus(id);
    return result;
  },

  assignService: async (idBranch, idService) => {
    const result = await branchService.assignServiceToBranch(idBranch, idService);
    return result;
  },

  unassignService: async (idBranch, idService) => {
    const result = await branchService.unassignServiceFromBranch(idBranch, idService);
    return result;
  },


  setSuspend: async (idBranch, suspendDate) => {
    const result = await branchService.setSuspendDate(idBranch,
      suspendDate);
    return result;
  },
   setResume: async (idBranch,resumeDate) => {
    const result = await branchService.setResumeDate(idBranch,
     resumeDate);
    return result;
  },
};
