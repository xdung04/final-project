import React from "react";
import classNames from "classnames/bind";
import styles from "./BarberTab.module.scss"; // Dùng CSS Module riêng
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  ResponsiveContainer, Legend, Tooltip 
} from "recharts";
import { Scissors, AlertCircle, BrainCircuit } from "lucide-react";

const cx = classNames.bind(styles);

// Dữ liệu giả định truyền vào hoặc fetch tại đây
const barberSkillsData = [
  { subject: 'Fade', A: 95, B: 80 },
  { subject: 'Uốn', A: 70, B: 95 },
  { subject: 'Tư vấn AI', A: 90, B: 75 },
  { subject: 'Cạo mặt', A: 85, B: 90 },
  { subject: 'Nhuộm', A: 60, B: 88 },
];

const BarberTab = () => {
  return (
    <div className={cx("tabWrapper")}>
      {/* 1. Cảnh báo hiệu suất */}
      <div className={cx("alertSection")}>
        <div className={cx("alertCard", "danger")}>
          <AlertCircle size={20} />
          <span><strong>Barber A:</strong> Đang quá tải (12 ca/ngày). Nguy cơ giảm chất lượng Fade!</span>
        </div>
      </div>

      {/* 2. Biểu đồ Radar & Insight */}
      <div className={cx("contentRow")}>
        <div className={cx("chartCard")}>
          <div className={cx("cardHeader")}>
             <h4>So sánh kỹ năng: Barber A vs Barber B</h4>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={barberSkillsData}>
              <PolarGrid stroke="#eee" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 12 }} />
              <Radar 
                name="Barber A (Thợ Chính)" 
                dataKey="A" 
                stroke="#D4AF37" 
                fill="#D4AF37" 
                fillOpacity={0.5} 
              />
              <Radar 
                name="Barber B (Thợ Phụ)" 
                dataKey="B" 
                stroke="#2C2C2C" 
                fill="#2C2C2C" 
                fillOpacity={0.5} 
              />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className={cx("insightCard")}>
          <h5><BrainCircuit size={18} /> AI Chiến lược Thợ</h5>
          <div className={cx("insightItem")}>
            <strong>Sở trường thợ:</strong>
            <p>Barber B có kỹ năng <strong>Uốn/Nhuộm</strong> xuất sắc (95 điểm). AI gợi ý điều phối khách hàng chọn dịch vụ Chemical cho Barber B.</p>
          </div>
          <div className={cx("insightItem")}>
             <strong>Đào tạo:</strong>
             <p>Barber A cần cải thiện kỹ năng <strong>Nhuộm màu trend</strong> để đồng bộ với các gợi ý từ AI trong năm 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberTab;