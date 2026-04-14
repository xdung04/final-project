import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js"; // Đảm bảo đường dẫn này đúng
import multer from "multer";

const cloudinaryStorageReel = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Xác định thư mục lưu trữ và loại tài nguyên (video/image)
    if (file.mimetype.startsWith("video/")) {
      return { 
        folder: "reels", 
        resource_type: "video",
        quality: "auto", 
        fetch_format: "auto"
      };
    }
    // Dành cho thumbnail
    return { 
      folder: "reels/thumbnails", 
      resource_type: "image" 
    };
  },
});

export const uploadReel = multer({ storage: cloudinaryStorageReel });

const storageBasic = multer.memoryStorage(); 

export const uploadBasic = multer({ storage: storageBasic });
