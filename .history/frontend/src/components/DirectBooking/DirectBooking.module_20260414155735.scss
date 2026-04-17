@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

$gold: #b8966a;
$gold-dark: #967a54;
$bg-dark: #1c1c1c;
$bg-card: #252525;
$text-main: #fdfbf8;
$text-dim: #a3a3a3;
$border-color: rgba(184, 150, 106, 0.25);
$danger: #d9534f;

.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'DM Sans', sans-serif;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.form {
  background-color: $bg-dark;
  color: $text-main;
  padding: 30px;
  border-radius: 12px;
  width: 480px; // Mở rộng nhẹ để form thoáng hơn
  position: relative;
  border: 1px solid $border-color;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

h2 {
  font-family: 'Playfair Display', serif;
  color: $gold;
  font-size: 26px;
  margin: 0 0 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $border-color;
  padding-bottom: 15px;
}

.createCustomerBtn {
  background: transparent;
  color: $gold;
  border: 1px solid $gold;
  border-radius: 6px;
  padding: 8px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: $gold;
    color: $bg-dark;
    box-shadow: 0 4px 12px rgba(184, 150, 106, 0.3);
  }
}

.closeBtn {
  position: absolute;
  right: 20px;
  top: 20px;
  background: none;
  border: none;
  color: $text-dim;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 10;

  &:hover {
    color: $gold;
    transform: scale(1.1);
  }
}

/* ----- Form Content & Scrollbar ----- */
.scrollable {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 20px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: $gold-dark; border-radius: 4px; }
}

.section {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;

  label {
    color: $text-dim;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  input, select {
    background: $bg-card;
    border: 1px solid $border-color;
    color: $text-main;
    border-radius: 6px;
    padding: 12px 14px;
    font-size: 15px;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: $gold;
      box-shadow: 0 0 0 2px rgba(184, 150, 106, 0.1);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b8966a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 14px center;
    background-size: 16px;
    padding-right: 40px;
  }
}

.phoneRow {
  display: flex;
  gap: 10px;

  input { flex: 1; }

  button {
    background-color: $bg-card;
    color: $gold;
    border: 1px solid $gold;
    padding: 0 20px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;

    &:hover:not(:disabled) {
      background-color: $gold;
      color: $bg-dark;
    }
    
    &:disabled {
      border-color: $border-color;
      color: $text-dim;
      cursor: wait;
    }
  }
}

/* ----- Time Slots ----- */
.timeGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
  gap: 10px;
}

.timeSlot {
  padding: 10px 0;
  border: 1px solid $border-color;
  background: transparent;
  color: $text-main;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover:not(.booked):not(:disabled) {
    border-color: $gold;
    color: $gold;
  }

  &.booked, &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background: rgba(0,0,0,0.2);
  }

  &.selected {
    background-color: $gold;
    border-color: $gold;
    color: $bg-dark;
    font-weight: 700;
  }
}

/* ----- Service List ----- */
.serviceList {
  list-style: none;
  padding: 0;
  margin-top: 12px;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: $bg-card;
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 8px;
    font-size: 14px;

    button {
      background: rgba(217, 83, 79, 0.1);
      border: none;
      color: $danger;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: 0.2s;

      &:hover { background: $danger; color: white; }
    }
  }
}

/* ----- Total Price & Submit ----- */
.priceBox {
  background: rgba(184, 150, 106, 0.05);
  border: 1px dashed $gold;
  border-radius: 6px;
  padding: 16px;
  text-align: right;
  margin-bottom: 0;

  p {
    margin: 0;
    color: $text-dim;
    font-size: 14px;
    
    strong {
      color: $gold;
      font-size: 20px;
      font-weight: 700;
      margin-left: 8px;
    }
  }
}

.submitContainer {
  padding-top: 20px;
  border-top: 1px solid $border-color;
}

.submitBtn {
  background: linear-gradient(135deg, $gold 0%, $gold-dark 100%);
  border: none;
  color: $bg-dark;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(184, 150, 106, 0.4);
    transform: translateY(-2px);
  }
}

/* ----- Popup Tạo Khách Hàng ----- */
.popupOverlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  backdrop-filter: blur(2px);
}

.popupContent {
  background-color: $bg-dark;
  border: 1px solid $gold;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);

  h3 {
    font-family: 'Playfair Display', serif;
    color: $gold;
    margin: 0 0 20px 0;
    font-size: 22px;
  }
}

.popupBtnRow {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 25px;

  button {
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    border: none;
    transition: 0.3s;

    &.cancelBtn {
      background: transparent;
      color: $text-dim;
      border: 1px solid $text-dim;

      &:hover { color: white; border-color: white; }
    }

    &.createBtn {
      background: $gold;
      color: $bg-dark;

      &:hover { background: $gold-dark; }
    }
  }
}