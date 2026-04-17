import React, { useState, useEffect } from "react";
import styles from "./PaymentModal.module.scss";
import Step1_BookingInfo from "./BookingInfo";
import Step2_Rating from "./Rating";
import Step3_Tips from "./Tips";
import Step4_Invoice from "./Invoice";

export default function PaymentModal({ booking, onClose, onPaidSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (!booking) return;

    const initialData = {
      booking: {
        idBooking: booking.idBooking || booking.id,
        customer: booking.customer?.name || "Khách lẻ",
        barber: booking.barber?.name || "Chưa chỉ định",
        time: booking.bookingTime || "Không rõ",
        branch: booking.branch?.name || "",
        barberId: booking.barber?.idBarber || booking.barber?.id,
        idVoucher: booking.idVoucher || null, // ✅ thêm dòng này
      },
      services:
        booking.services?.map((s) => ({
          id: s.idService || s.id,
          name: s.name,
          price: parseFloat(s.price) || 0,
          selected: true,
        })) || [],
      voucher: null,
      serviceRating: 0,
      tip: booking.tip || 0,
      note: booking.description || "",
    };

    setFormData(initialData);
  }, [booking]);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  if (!formData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {step === 1 && <Step1_BookingInfo data={formData} setData={setFormData} onNext={nextStep} />}
        {step === 2 && <Step2_Rating data={formData} setData={setFormData} onNext={nextStep} onBack={prevStep} />}
        {step === 3 && <Step3_Tips data={formData} setData={setFormData} onNext={nextStep} onBack={prevStep} />}
        {step === 4 && (
          <Step4_Invoice data={formData} onBack={prevStep} onClose={onClose} onPaidSuccess={onPaidSuccess} />
        )}
      </div>
    </div>
  );
}
