import React from "react";
import classNames from "classnames/bind";
import styles from "./CustomerTab.module.scss";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, UserCheck, AlertTriangle } from "lucide-react";

const cx = classNames.bind(styles);

const data = [
  { name: 'Member (VIP)', value: 450, color: "#D4AF37" },
  { name: 'Guest (Vãng lai)', value: 320, color: "#1A1A1A" },
];

const CustomerTab = () => (
  <div className={cx("wrapper")}>
    <div className={cx("grid")}>
      <div className={cx("pieCard")}>
        <h4>Cấu trúc khách hàng</h4>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={cx("riskCard")}>
        <div className={cx("header")}>
          <h4><AlertTriangle size={20} color="#f43f5e" /> Khách hàng "At-Risk"</h4>
          <span>30 ngày chưa quay lại</span>
        </div>
        <div className={cx("list")}>
          {[
            { name: "Nguyễn Văn An", days: 45, spend: "1.2M" },
            { name: "Trần Minh Hoàng", days: 32, spend: "850k" },
            { name: "Lê Cường", days: 50, spend: "2.1M" },
          ].map((item, i) => (
            <div key={i} className={cx("item")}>
              <div className={cx("user")}>
                <p>{item.name}</p>
                <small>{item.days} ngày vắng mặt</small>
              </div>
              <button className={cx("btnVoucher")}>Gửi Voucher</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CustomerTab;