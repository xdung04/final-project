import React from "react";
import classNames from "classnames/bind";
import styles from "./TrendTab.module.scss";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Flame, TrendingUp } from "lucide-react";

const cx = classNames.bind(styles);

const trendData = [
  { name: 'Mullet', shop: 45, social: 85 },
  { name: 'Side Part', shop: 70, social: 75 },
  { name: 'Buzz Cut', shop: 20, social: 60 },
  { name: 'Uốn xoăn', shop: 35, social: 80 },
];

const TrendTab = () => (
  <div className={cx("wrapper")}>
    <div className={cx("chartCard")}>
      <div className={cx("header")}>
        <h4><Flame size={20} color="#f43f5e" /> Xu hướng 2026: Shop vs Social</h4>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="shop" fill="#1A1A1A" name="Khách chọn tại tiệm (%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="social" fill="#D4AF37" name="Trend mạng xã hội (%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className={cx("trendInsight")}>
        <TrendingUp size={18} />
        <span>Kiểu <strong>Mullet hiện đại</strong> đang bùng nổ trên mạng xã hội nhưng tỷ lệ phục vụ tại tiệm còn thấp. Đề xuất: Chạy quảng cáo dịch vụ Mullet kèm uốn texture.</span>
      </div>
    </div>
  </div>
);

export default TrendTab;