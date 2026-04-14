import db from "../models/index.js";
import { Op } from "sequelize";

class BookingHistoryService {
  async getBookingsByCustomer(idCustomer) {
    const bookings = await db.Booking.findAll({
      where: { idCustomer },
      include: [
        {
          model: db.Barber,
          as: "barber",
          include: [
            {
              model: db.User,
              as: "user",
              attributes: ["fullName", "image"]
            },
            {
              model: db.Branch,
              as: "branch",
              attributes: ["name", "address"]
            }
          ]
        },
        {
          model: db.BookingDetail,
          as: "BookingDetails",
          include: [
            {
              model: db.Service,
              as: "service",
              attributes: ["name"]
            }
          ]
        }
      ],
      order: [["bookingDate", "DESC"]],
    });

    const now = new Date();

    const formatBooking = (b) => ({
      idBooking: b.idBooking,
      date: b.bookingDate.toISOString().split("T")[0],
      time: b.bookingTime,
      barber: {
        name: b.barber.user.fullName,
        avatar: b.barber.user.image || "https://via.placeholder.com/60",
      },
      branch: {
        name: b.barber.branch.name,
        address: b.barber.branch.address,
      },
      service: b.BookingDetails.map(d => d.service.name).join(" + "),
      total: parseFloat(b.total),
      status: b.status.toUpperCase(), // fix luôn lỗi FE
    });

    const completed = bookings
      .filter(b => b.status === "Completed")
      .map(formatBooking);

    const upcoming = bookings
      .filter(b => 
        b.status === "Pending" || b.status === "Confirmed"
      )
      .map(formatBooking);

    return {
      completed,
      upcoming
    };
  }
}

export default new BookingHistoryService();