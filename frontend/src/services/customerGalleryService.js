import customerGalleryApi from "~/apis/customerGalleryAPI";

// Không còn cần truyền token — cookie tự gửi kèm.
// LƯU Ý: customerGalleryApi giờ trả thẳng data (đã bóc .data sẵn), bỏ .data ở dưới.

export const fetchBarberGallery = async (barberId) => {
  const res = await customerGalleryApi.getByBarber(barberId);
  return res;
};

export const fetchCustomerGallery = async () => {
  const res = await customerGalleryApi.getByCustomer();
  return res;
};