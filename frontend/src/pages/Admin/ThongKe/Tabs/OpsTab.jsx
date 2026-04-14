import React from "react";
import classNames from "classnames/bind";
import styles from "./OpsTab.module.scss";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Clock, TrendingUp } from "lucide-react";

const cx = classNames.bind(styles);

const forecastData = [
  { day: 'Thứ 2', thucTe: 45, duBao: 48 },
  { day: 'Thứ 3', thucTe: 42, duBao: 40 },
  { day: 'Thứ 4', thucTe: 50, duBao: 52 },
  { day: 'Thứ 5', thucTe: 48, duBao: 55 },
  { day: 'Thứ 6', thucTe: 65, duBao: 70 },
  { day: 'Thứ 7', thucTe: 0, duBao: 95 },
  { day: 'Chủ Nhật', thucTe: 0, duBao: 110 },
];

const OpsTab = () => (
  <div className={cx("wrapper")}>
    <div className={cx("forecastCard")}>
      <div className={cx("header")}>
        <h4><TrendingUp size={20} color="#D4AF37" /> Dự báo lượng khách (AI Forecast)</h4>
        <p>Tuần tới dự kiến tăng 15% do kỳ nghỉ lễ</p>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={forecastData}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="duBao" stroke="#D4AF37" fillOpacity={1} fill="url(#colorVal)" name="Dự báo AI" />
          <Area type="monotone" dataKey="thucTe" stroke="#1A1A1A" fill="#1A1A1A" fillOpacity={0.1} name="Thực tế" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default OpsTab;