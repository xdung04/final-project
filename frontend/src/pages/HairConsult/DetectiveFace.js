const getDistance = (p1, p2, w, h) => {
  const dx = (p1.x - p2.x) * w;
  const dy = (p1.y - p2.y) * h;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAverageDistance = (points, w, h) => {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    sum += getDistance(points[i], points[i + 1], w, h);
  }
  return sum / (points.length - 1);
};

export function detectFaceShapeMale(lm, w, h) {
  if (!lm || lm.length < 468) return "Không xác định";

  // --- Tính các thông số chính ---
  const jawPoints = [lm[234], lm[454], lm[152]]; // cằm
  const jawWidth = getAverageDistance(jawPoints, w, h);

  const faceLength = getDistance(lm[10], lm[152], w, h);

  const foreheadPoints = [lm[71], lm[301], lm[9]]; // trán
  const foreheadWidth = getAverageDistance(foreheadPoints, w, h);

  const cheekPoints = [lm[123], lm[352], lm[1]]; // má
  const cheekWidth = getAverageDistance(cheekPoints, w, h);

  const ratioLengthJaw = faceLength / jawWidth;       // chiều dài / jaw
  const ratioCheekForehead = cheekWidth / foreheadWidth; // má / trán

  // Góc jaw (hàm lượng giác)
  const jawAngle = Math.atan2(lm[152].y - lm[234].y, lm[152].x - lm[234].x) * (180 / Math.PI);

  // --- Phân loại khuôn mặt ---
  if (ratioLengthJaw >= 1.05 && ratioLengthJaw <= 1.35) {
    if (ratioCheekForehead >= 0.9 && ratioCheekForehead <= 1.1) return "Oval (Trái xoan)";
    if (ratioCheekForehead < 0.9) return "Heart (Trái tim)";
    if (ratioCheekForehead > 1.1) return "Diamond (Kim cương)";
  }

  if (ratioLengthJaw >= 0.95 && ratioLengthJaw < 1.05) {
    if (ratioCheekForehead >= 0.95 && ratioCheekForehead <= 1.05) return "Round (Tròn)";
    if (ratioCheekForehead < 0.95) return "Triangle (Tam giác ngược)";
    if (ratioCheekForehead > 1.05) return "Square (Vuông)";
  }

  if (ratioLengthJaw > 1.35) return "Tam giác dài / Rectangle long";

  return "Không xác định";
}
