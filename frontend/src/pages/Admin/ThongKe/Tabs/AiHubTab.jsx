import React from "react";
import classNames from "classnames/bind";
import styles from "./AiHubTab.module.scss";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Target, Star, Zap, BrainCircuit } from "lucide-react";

const cx = classNames.bind(styles);

const faceShapeData = [
  { name: 'Tròn', val: 88, color: "#D4AF37" },
  { name: 'Vuông', val: 72, color: "#2C2C2C" },
  { name: 'Trái xoan', val: 96, color: "#D4AF37" },
  { name: 'Kim cương', val: 80, color: "#2C2C2C" },
  { name: 'Dài', val: 85, color: "#D4AF37" },
];

const AiHubTab = () => (
  <div className={cx("wrapper")}>
    <div className={cx("kpiGrid")}>
      <div className={cx("card")}>
        <Target className={cx("icon")} />
        <div className={cx("info")}><span>AI Conversion</span><h3>64.5%</h3><small>+12% tháng này</small></div>
      </div>
      <div className={cx("card")}>
        <Star className={cx("icon")} />
        <div className={cx("info")}><span>Hài lòng</span><h3>4.8/5</h3><small>1.2k đánh giá</small></div>
      </div>
      <div className={cx("card")}>
        <Zap className={cx("icon")} />
        <div className={cx("info")}><span>Phản hồi</span><h3>0.8s</h3><small>Xử lý tức thì</small></div>
      </div>
    </div>

    <div className={cx("mainGrid")}>
      <div className={cx("chartSection")}>
        <h4>Độ chính xác tư vấn theo dáng mặt</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={faceShapeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: '#f5f5f5'}} />
            <Bar dataKey="val" radius={[6, 6, 0, 0]} barSize={40}>
              {faceShapeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={cx("insightSection")}>
        <h5><BrainCircuit size={18} /> AI Strategy Insight</h5>
        <p>Hệ thống nhận diện cực tốt mặt <strong>Trái xoan</strong>. Tuy nhiên, khách mặt <strong>Vuông</strong> thường yêu cầu tư vấn lại (72%).</p>
        <div className={cx("recommendation")}>
          <strong>Đề xuất:</strong> Cập nhật thêm 50 mẫu tóc Layer và Side Part rủ cho dữ liệu mặt Vuông để tăng tỷ lệ chốt đơn.
        </div>
      </div>
    </div>
  </div>
);

export default AiHubTab;