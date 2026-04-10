import db from "../models/index.js";
import cloudinary from "../config/cloudinary.js";

// ====== Lấy profile (theo role) ======
const getUserProfileWithRole = async (idUser) => {
  return await db.User.findByPk(idUser, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: db.Customer,
        as: "customer",
        attributes: ["idCustomer", "loyaltyPoint", "address", "createdAt", "updatedAt"],
      },
      {
        model: db.Barber,
        as: "barber",
        attributes: ["idBarber", "profileDescription", "createdAt", "updatedAt"],

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

// ====== Cập nhật profile ======
const updateUserProfile = async (idUser, { fullName, email, phoneNumber, avatarFile }) => {
  const user = await db.User.findByPk(idUser);
  if (!user) return null;

  let imageUrl = user.image;

  // Nếu có file ảnh mới thì upload
  if (avatarFile) {
    const uploadResult = await uploadToCloudinary(avatarFile.buffer);
    imageUrl = uploadResult.secure_url;
  }

  // Chỉ update các trường được truyền vào
  const updateData = {
    ...(fullName && { fullName }),
    ...(email && { email }),
    ...(phoneNumber && { phoneNumber }),
    image: imageUrl,
  };

  await user.update(updateData);
  return user;
};

const updatePhone = async (idUser, phoneNumber) => {
  const user = await db.User.findByPk(idUser);
  if (!user) return null;

  user.phoneNumber = phoneNumber;
  await user.save();

  return user;
};
// ====== Export ======
export default {
  getUserProfileWithRole,
  updateUserProfile,
  updatePhone,
};
