import db from "../models/index.js";

const { SalaryContract, Barber, User, Branch, CompensationPlan } = db;

/**
 * Lấy hợp đồng đang active của barber đang đăng nhập
 * @param {number} idBarber - Lấy từ req.user.idUser (JWT)
 */
export const getContractByBarberId = async (idBarber) => {
  const contract = await SalaryContract.findOne({
    where: {
      idBarber,
      status: "active",
    },
    order: [["createdAt", "DESC"]],
    attributes: [
      "idSalaryContract",
      "startDate",
      "endDate",
      "actualBaseSalary",
      "status",
      "createdAt",
    ],
    include: [
      {
        model: Barber,
        as: "barber",
        attributes: ["experienceYears", "specialty", "style"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "phoneNumber", "email", "image"],
          },
          {
            model: Branch,
            as: "branch",
            attributes: ["name", "address"],
          },
        ],
      },
      {
        model: CompensationPlan,
        as: "plan",
        attributes: [
          "displayName",
          "roleType",
          "defaultBaseSalary",
          "minRevenueToPromote",
          "evaluationPeriodMonths",
        ],
      },
    ],
  });

  if (!contract) throw new Error("Không tìm thấy hợp đồng cho barber này");

  return contract;
};

/**
 * Lấy toàn bộ lịch sử hợp đồng của barber (active, closed, terminated)
 * @param {number} idBarber - Lấy từ req.user.idUser (JWT)
 */
export const getContractHistoryByBarberId = async (idBarber) => {
  const contracts = await SalaryContract.findAll({
    where: { idBarber },
    order: [["createdAt", "DESC"]],
    attributes: [
      "idSalaryContract",
      "startDate",
      "endDate",
      "actualBaseSalary",
      "status",
      "createdAt",
    ],
    include: [
      {
        model: Barber,
        as: "barber",
        attributes: ["experienceYears", "specialty", "style"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["fullName", "phoneNumber", "email", "image"],
          },
          {
            model: Branch,
            as: "branch",
            attributes: ["name", "address"],
          },
        ],
      },
      {
        model: CompensationPlan,
        as: "plan",
        attributes: [
          "displayName",
          "roleType",
          "defaultBaseSalary",
          "minRevenueToPromote",
          "evaluationPeriodMonths",
        ],
      },
    ],
  });

  if (!contracts || contracts.length === 0)
    throw new Error("Barber này chưa có hợp đồng nào");

  return contracts;
};