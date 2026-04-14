import db from "../models/index.js";

export const getCustomerGalleryByBarber = async (barberId) => {
  return await db.CustomerGallery.findAll({
    where: { uploadBy: barberId },
    include: [
      {
        model: db.Booking,
        include: [
          {
            model: db.Customer,
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["fullName"],
              },
            ],
          },
          {
            model: db.BookingDetail,
            as: "BookingDetails",
            include: [
              { model: db.Service, as: "service", attributes: ["name"] },
            ],
          },
        ],
      },
      {
        model: db.Barber,
        attributes: ["idBarber"], 
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["fullName"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};
export const getCustomerGalleryByCustomer = async (customerId) => {
  return await db.CustomerGallery.findAll({
    include: [
      {
        model: db.Booking,
        where: { idCustomer: customerId }, // dùng idCustomer từ token
        attributes: ["idBooking", "bookingDate", "description"],
        include: [
          {
            model: db.Customer,
            attributes: ["idCustomer"],
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["fullName"],
              },
            ],
          },
          {
            model: db.BookingDetail,
            as: "BookingDetails",
            include: [
              { model: db.Service, as: "service", attributes: ["name"] },
            ],
          },
        ],
      },
      {
        model: db.Barber,
        attributes: ["idBarber"],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["fullName"],
          },
        ],
      },
    ],
    order: [[db.Booking, "bookingDate", "DESC"]],
  });
};
