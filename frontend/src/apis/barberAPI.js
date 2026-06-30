import * as barberService from "~/services/barberService";

export const BarberAPI = {
  getAll: async () => {
    const result = await barberService.getAllBarbers();
    return result.barbers;
  },

  assignUser: async (payload) => {
    return await barberService.assignUserAsBarber(payload);
  },

  assignBranch: async (payload) => {
    return await barberService.assignBarberToBranch(payload);
  },

  lock: async (idBarber) => {
    return await barberService.lockBarber({ idBarber });
  },

  unlock: async (idBarber) => {
    return await barberService.unlockBarber({ idBarber });
  },

  setLockDate: async (idBarber, lockDate) => {
    return await barberService.setBarberLockDate(idBarber, lockDate);
  },

  cancelLockDate: async (idBarber) => {
    return await barberService.cancelBarberLockDate(idBarber);
  },

  getReward: async (idBarber) => {
    const result = await barberService.getBarberReward(idBarber);
    return result;
  },
  createBarber: async (payload) => {
    return await barberService.createBarberWithUser(payload);
  },
  updateBarber: async (idBarber, payload) => {
    return await barberService.updateBarber(idBarber, payload);
  },
  deleteBarber: async (idBarber) => {
    return await barberService.deleteBarber(idBarber);
  },
  addUnavailability: async (payload) => {
    return await barberService.addUnavailability(payload);
  },
  getUnavailabilitiesByBarber: async (idBarber) => {
    return await barberService.getUnavailabilitiesByBarber(idBarber);
  },
  getProfile: async (idBarber) => {
    const result = await barberService.getProfile(idBarber);
    return result;
  },
  updateProfile: async (idBarber, payload, token) => {
    return await barberService.updateProfile(idBarber, payload, token);
  },
  getBarberForHome: async () => {
    const result = await barberService.getBarbersForHome();
    return result;
  },
};
