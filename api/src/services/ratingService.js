import db from "../models/index.js";
const Barber = db.Barber;
const User = db.User;
const BarberRatingSummary = db.BarberRatingSummary;

const getRatingSummaryByBarber = async (idBarber) => {
  const summary = await BarberRatingSummary.findOne({ where: { idBarber } });
  return summary || null;
};

const updateRating = async (idBarber, newRate) => {
  let summary = await BarberRatingSummary.findOne({ where: { idBarber } });

  if (!summary) {
    summary = await BarberRatingSummary.create({
      idBarber,
      totalRate: 1,     // tổng lượt đánh giá
      avgRate: newRate, // điểm trung bình
    });
  } else {
    const totalRate = summary.totalRate + 1; // tăng 1 lượt đánh giá
    const avgRate = parseFloat(
      ((summary.avgRate * summary.totalRate + newRate) / totalRate).toFixed(2)
    );

    await summary.update({ totalRate, avgRate });
  }

  return summary;
};

const getAllRatingsByBranch= async (idBranch) => {
  const barbers = await Barber.findAll({
    where: { idBranch },
    attributes: ["idBarber"], // chỉ lấy id barber
    include: [
      {
        model: User,
        as: "user",          // theo alias trong Barber.associate
        attributes: ["fullName"], // lấy tên barber
      },
      {
        model: BarberRatingSummary,
        as: "ratingSummary",
        attributes: ["avgRate"], // lấy điểm trung bình
      },
    ],
  });

  return barbers;
};

export default {
  getRatingSummaryByBarber,
  updateRating,
  getAllRatingsByBranch,
};
