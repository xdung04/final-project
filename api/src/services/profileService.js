import db from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import bcrypt from "bcryptjs";


const salt = bcrypt.genSaltSync(10);

async function hashUserPassword(password) {
  return bcrypt.hash(password, salt);
}

// ====== Lấy profile (theo role) ======
const getUserProfileWithRole = async (idUser) => {
  return await db.User.findByPk(idUser, {
    attributes: {
      exclude: ["password"],
    },
    include: [
      {
        model: db.Customer,
        as: "customer",
        attributes: [
          "idCustomer",
          "loyaltyPoint",
          "address",
          "createdAt",
          "updatedAt",
        ],
      },
      {
        model: db.Barber,
        as: "barber",
        attributes: [
          "idBarber",
          "profileDescription",
          "createdAt",
          "updatedAt",
        ],
      },
    ],
  });
};

// ====== Upload buffer lên Cloudinary ======
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "avatars" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const changePassword = async (
  idUser,
  currentPassword,
  newPassword
) => {

  if (!currentPassword || !newPassword) {
    throw {
      status: 400,
      message: "Vui lòng nhập đầy đủ thông tin",
    };
  }

  if (newPassword.length < 6) {
    throw {
      status: 400,
      message: "Mật khẩu mới phải tối thiểu 6 ký tự",
    };
  }

  const user = await db.User.findByPk(idUser);

  if (!user) {
    throw {
      status: 404,
      message: "User không tồn tại",
    };
  }

  // Chặn Google account
  if (user.authProvider === "google") {
    throw {
      status: 400,
      message:
        "Tài khoản Google không hỗ trợ đổi mật khẩu",
    };
  }

  // Verify mật khẩu cũ
  const isMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw {
      status: 400,
      message: "Mật khẩu hiện tại không đúng",
    };
  }

  // Không cho đổi trùng mật khẩu cũ
  const samePassword = await bcrypt.compare(
    newPassword,
    user.password
  );

  if (samePassword) {
    throw {
      status: 400,
      message:
        "Mật khẩu mới không được trùng mật khẩu cũ",
    };
  }

  const hashPassword =
    await hashUserPassword(newPassword);

  await user.update({
    password: hashPassword,
  });

  return {
    success: true,
    message: "Đổi mật khẩu thành công",
  };
};

// ====== Cập nhật profile ======
const updateUserProfile = async (idUser, { fullName, email, phoneNumber, avatarFile }) => {
  const t = await db.sequelize.transaction();

  try {
    const user = await db.User.findByPk(idUser, { transaction: t });
    if (!user) {
      throw { status: 404, message: "User không tồn tại" };
    }

    // Kiểm tra phoneNumber nếu có truyền vào
    if (phoneNumber) {
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw { 
          status: 400, 
          message: "Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0" 
        };
      }

      const existingUser = await db.User.findOne({
        where: { phoneNumber },
        transaction: t,
      });

      if (existingUser && existingUser.idUser !== idUser) {
        throw { 
          status: 409, 
          message: "Số điện thoại này đã được sử dụng bởi một tài khoản khác." 
        };
      }
    }

    // Upload ảnh nếu có
    let imageUrl = user.image;
    if (avatarFile) {
      const uploadResult = await uploadToCloudinary(avatarFile.buffer);
      imageUrl = uploadResult.secure_url;
    }

    // Update dữ liệu
    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),           // cho phép update email nếu cần
      ...(phoneNumber && { phoneNumber }),
      image: imageUrl,
    };

    await user.update(updateData, { transaction: t });

    await t.commit();
    return user;
  } catch (error) {
    if (t && !t.finished) {
      await t.rollback().catch(() => {});
    }
    console.error("Lỗi updateUserProfile:", error);
    throw error;
  }
};

const updatePhone = async (idUser, phoneNumber) => {
  if (!phoneNumber) {
    throw { status: 400, message: "Số điện thoại không được để trống" };
  }

  // Kiểm tra định dạng số điện thoại
  const phoneRegex = /^0[0-9]{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw { 
      status: 400, 
      message: "Số điện thoại phải là 10 chữ số và bắt đầu bằng số 0" 
    };
  }

  const t = await db.sequelize.transaction();

  try {
    const user = await db.User.findByPk(idUser, { transaction: t });
    if (!user) {
      throw { status: 404, message: "User không tồn tại" };
    }

    // Nếu user đã có phoneNumber thì chỉ update
    if (user.phoneNumber) {
      user.phoneNumber = phoneNumber;
      await user.save({ transaction: t });
      await t.commit();
      return user;
    }

    // Kiểm tra số điện thoại có tồn tại không
    const existingUser = await db.User.findOne({
      where: { phoneNumber },
      transaction: t,
    });

    if (existingUser) {
      if (existingUser.idUser === user.idUser) {
        // Trùng chính mình
        user.phoneNumber = phoneNumber;
        await user.save({ transaction: t });
        await t.commit();
        return user;
      }

      // Kiểm tra có phải tài khoản admin-created chưa active không
      const isAdminCreatedInactive =
        existingUser.isStatus === false &&
        !existingUser.email &&
        !existingUser.password &&
        !existingUser.googleId;

      if (isAdminCreatedInactive) {
        // === MERGE ===
        await db.Customer.destroy({ 
          where: { idCustomer: user.idUser }, 
          transaction: t 
        });
        await db.User.destroy({ 
          where: { idUser: user.idUser }, 
          transaction: t 
        });

        existingUser.email = user.email;
        existingUser.googleId = user.googleId;
        existingUser.fullName = user.fullName || existingUser.fullName;
        existingUser.image = user.image || existingUser.image;
        existingUser.authProvider = "google";
        existingUser.isStatus = true;
        existingUser.phoneNumber = phoneNumber;

        await existingUser.save({ transaction: t });

        console.log(`✅ Merged Google account vào admin-created account ${existingUser.idUser}`);
        await t.commit();
        return existingUser;
      } else {
        // Trùng với tài khoản đã active → KHÔNG CHO PHÉP
        await t.rollback();
        throw { 
          status: 409, 
          message: "Số điện thoại này đã được sử dụng bởi một tài khoản khác." 
        };
      }
    } 
    else {
      // Không trùng → thêm phone bình thường
      user.phoneNumber = phoneNumber;
      await user.save({ transaction: t });
    }

    await t.commit();
    return user;
  } catch (error) {
    // Chỉ rollback nếu transaction chưa kết thúc
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Lỗi updatePhone:", error);
    throw error;
  }
};
// ====== Export ======
export default {
  getUserProfileWithRole,
  updateUserProfile,
  updatePhone,
  changePassword,
};
