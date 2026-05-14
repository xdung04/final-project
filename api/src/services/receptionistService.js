import db from "../models/index.js";
import bcrypt from "bcryptjs";

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

// Lấy thông tin receptionist theo idBranch
export const getReceptionistByBranch = async (idBranch) => {
  const receptionist = await db.Receptionist.findOne({
    where: { idBranch },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["idUser", "fullName", "email", "phoneNumber", "image"],
      },
    ],
  });

  if (!receptionist) return null;

  return {
    idReceptionist: receptionist.idReceptionist,
    idBranch: receptionist.idBranch,
    fullName: receptionist.user?.fullName || "",
    email: receptionist.user?.email || "",
    phoneNumber: receptionist.user?.phoneNumber || "",
    image: receptionist.user?.image || "",
  };
};

// Admin cập nhật thông tin receptionist
export const updateReceptionistByAdmin = async (idBranch, data) => {
  const { fullName, email, phoneNumber, password } = data;

  // Tìm receptionist theo branch
  const receptionist = await db.Receptionist.findOne({
    where: { idBranch },
    include: [{ model: db.User, as: "user" }],
  });

  if (!receptionist) {
    throw { status: 404, message: "Không tìm thấy lễ tân của chi nhánh này" };
  }

  const user = await db.User.findByPk(receptionist.idReceptionist);
  if (!user) {
    throw { status: 404, message: "Không tìm thấy tài khoản người dùng" };
  }

  // Kiểm tra email trùng (nếu đổi email)
  if (email && email !== user.email) {
    const existing = await db.User.findOne({ where: { email } });
    if (existing) {
      throw { status: 409, message: "Email này đã được sử dụng bởi tài khoản khác" };
    }
  }

  // Kiểm tra phone trùng (nếu đổi phone)
  if (phoneNumber && phoneNumber !== user.phoneNumber) {
    const existing = await db.User.findOne({ where: { phoneNumber } });
    if (existing) {
      throw { status: 409, message: "Số điện thoại này đã được sử dụng bởi tài khoản khác" };
    }
  }

  // Build update object
  const updateData = {};
  if (fullName) updateData.fullName = fullName;
  if (email) updateData.email = email;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;
  if (password && password.trim() !== "") {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  await user.update(updateData);

  return {
    idReceptionist: receptionist.idReceptionist,
    idBranch: receptionist.idBranch,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    image: user.image || "",
  };
};
