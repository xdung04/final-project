import * as barberDayOffService from "../services/barberDayOffService.js";

const handle = (fn) => async (req, res) => {
  try {
    const data = await fn(req, res);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Lỗi server",
    });
  }
};

// GET /api/barber-day-offs
export const getAll = handle(async () => {
  return await barberDayOffService.getAllDayOffs();
});

// POST /api/barber-day-offs/preview
export const preview = handle(async (req) => {
  const { idBarber, startDate, endDate, excludeId } = req.body;
  if (!idBarber || !startDate || !endDate) {
    const err = new Error("Thiếu idBarber, startDate hoặc endDate");
    err.statusCode = 400;
    throw err;
  }
  return await barberDayOffService.previewDayOff({ idBarber, startDate, endDate, excludeId: excludeId || null });
});

// POST /api/barber-day-offs
export const create = handle(async (req) => {
  const { idBarber, startDate, endDate, reason } = req.body;
  if (!idBarber || !startDate || !endDate) {
    const err = new Error("Thiếu idBarber, startDate hoặc endDate");
    err.statusCode = 400;
    throw err;
  }
  if (startDate > endDate) {
    const err = new Error("startDate phải <= endDate");
    err.statusCode = 400;
    throw err;
  }
  return await barberDayOffService.createDayOff({ idBarber, startDate, endDate, reason });
});

// PUT /api/barber-day-offs/:id
export const update = handle(async (req) => {
  const { id } = req.params;
  const { startDate, endDate, reason } = req.body;
  if (!startDate || !endDate) {
    const err = new Error("Thiếu startDate hoặc endDate");
    err.statusCode = 400;
    throw err;
  }
  if (startDate > endDate) {
    const err = new Error("startDate phải <= endDate");
    err.statusCode = 400;
    throw err;
  }
  return await barberDayOffService.updateDayOff(Number(id), { startDate, endDate, reason });
});

// DELETE /api/barber-day-offs/:id
export const remove = handle(async (req) => {
  const { id } = req.params;
  return await barberDayOffService.deleteDayOff(Number(id));
});