import * as galleryService from "../services/customerGalleryService.js";

export const getByBarber = async (req, res) => {
  try {
    const barberId = parseInt(req.params.barberId);

    const galleries = await galleryService.getCustomerGalleryByBarber(barberId);

    const result = galleries.map((g) => ({
      id: g.idImage,
      idbooking: g.idBooking,
      customerName: g.Booking?.Customer?.user?.fullName ,
      barberName: g.Barber?.user?.fullName,
      service:
        g.Booking?.BookingDetails?.map((bd) => bd.service?.name).join(", "),
      description: g.description,
      photo: g.imageUrl,
      date: g.createdAt,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy gallery:", err);
    res.status(500).json({ error: "Không thể lấy danh sách sản phẩm" });
  }
};

export const getByCustomer = async (req, res) => {
  try {
    const customerId = req.user.idUser; // dùng token
    const galleries = await galleryService.getCustomerGalleryByCustomer(customerId);

    const result = galleries.map((g) => ({
      id: g.idImage,
      idbooking: g.idBooking,
      customerName: g.Booking?.Customer?.user?.fullName,
      barberName: g.Barber?.user?.fullName,
      service: g.Booking?.BookingDetails?.map((bd) => bd.service?.name).join(", "),
      description: g.description,
      photo: g.imageUrl,
      date: g.createdAt,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Lỗi lấy gallery theo Customer:", err);
    res.status(500).json({ error: "Không thể lấy danh sách sản phẩm của khách hàng" });
  }
};
