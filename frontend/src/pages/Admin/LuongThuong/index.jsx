import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./LuongThuong.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowTrendUp, faMagnifyingGlass, faCalculator, faLock, 
  faEye, faPenToSquare, faPaperPlane, faMoneyBillWave, faCircleExclamation 
} from "@fortawesome/free-solid-svg-icons";
import { SalaryAPI } from "~/apis/salaryAPI";
import PayslipModal from "~/components/PayslipModal";
import DeductionModal from "~/components/DeductionModal"; 

const cx = classNames.bind(styles);

function LuongThuong() {
  const [salaries, setSalaries] = useState([]);
  const [overview, setOverview] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [selectedBarber, setSelectedBarber] = useState(null); 
  const [editingDeduction, setEditingDeduction] = useState(null); 

  const fetchData = async (m, y) => {
    setLoading(true);
    try {
      const overviewData = await SalaryAPI.getSalaryOverview();
      setOverview(overviewData);
      const monthData = overviewData.find(item => item.month === m && item.year === y);
      setSalaries(monthData?.salaries || []);
    } catch (error) {
      console.error("Lỗi load dữ liệu:", error);
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(month, year);
  }, [month, year]);

  const calculateSalary = async () => {
    setLoading(true);
    try {
      const result = await SalaryAPI.calculateSalaries(month, year);
      alert(result.message || "Đã tính/cập nhật lại lương nháp!");
      fetchData(month, year);
    } catch (err) {
      alert("Tính lương thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeduction = async (payload) => {
    try {
      alert("Cập nhật khấu trừ thành công!");
      setEditingDeduction(null);
      fetchData(month, year);
    } catch (error) {
      alert("Lỗi khi cập nhật!");
    }
  };

  const handleSendPayslips = () => {
    if(window.confirm("Gửi phiếu lương cho thợ xác nhận?")) {
      alert("Đã gửi phiếu lương!");
    }
  };

  const handleMarkAsPaid = () => {
    if(window.confirm("Chuyển trạng thái sang Đã thanh toán và Khóa sổ?")) {
      alert("Đã chốt thanh toán!");
    }
  };

  const showDisputeReason = (reason) => {
    alert(`Lý do khiếu nại của thợ:\n\n"${reason}"`);
  };

  const monthOverview = overview.find(item => item.month === month && item.year === year);
  const canCalculate = monthOverview && !monthOverview.isCurrentMonth;
  const isLocked = monthOverview?.isLocked || false; 

  const filteredSalaries = salaries.filter(s =>
    (s.barberName || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.branchName || "").toLowerCase().includes(search.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch(status) {
      case "Bản nháp": return "draft";
      case "Chờ xác nhận": return "pending";
      case "Có khiếu nại": return "disputed";
      case "Đã xác nhận": return "confirmed";
      case "Đã thanh toán": return "paid";
      default: return "draft";
    }
  };

  return (
    <div className={cx("salaryPage")}>
      <div className={cx("header")}>
        <h2>Quản lý Lương & Hoa hồng</h2>

        <div className={cx("controlsWrapper")}>
          <div className={cx("filters")}>
            <select className={cx("selectBox")} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <select className={cx("selectBox")} value={year} onChange={e => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={2023 + i}>{2023 + i}</option>
              ))}
            </select>
            
            <button className={cx("btn-outline")} onClick={() => fetchData(month, year)} disabled={loading}>
              <FontAwesomeIcon icon={faArrowTrendUp} /> Cập nhật Data
            </button>
            
            {isLocked ? (
              <button className={cx("btn-locked")} disabled>
                <FontAwesomeIcon icon={faLock} /> Đã khóa sổ
              </button>
            ) : (
              <>
                <button className={cx("btn-primary")} onClick={calculateSalary} disabled={!canCalculate || loading}>
                  <FontAwesomeIcon icon={faCalculator} /> Tính lương (Nháp)
                </button>
                <button className={cx("btn-action")} onClick={handleSendPayslips}>
                  <FontAwesomeIcon icon={faPaperPlane} /> Gửi phiếu lương
                </button>
                <button className={cx("btn-success")} onClick={handleMarkAsPaid}>
                  <FontAwesomeIcon icon={faMoneyBillWave} /> Thanh toán
                </button>
              </>
            )}
          </div>

          <div className={cx("searchBox")}>
            <input
              type="text"
              placeholder="Tìm thợ hoặc chi nhánh..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </div>
        </div>
      </div>

      <div className={cx("salaryTableWrapper")}>
        <div className={cx("tableHeader")}>
          <h3>Bảng tổng hợp thu nhập tháng {month}/{year}</h3>
          <p className={cx("desc")}>
            Thực nhận = (Cơ bản + Hoa hồng + Phụ cấp + Tip) - Khấu trừ
          </p>
        </div>

        {loading ? (
          <p className={cx("loadingText")}>Đang xử lý dữ liệu hệ thống...</p>
        ) : (
          <div className={cx("tableContainer")}>
            <table>
              <thead>
                <tr>
                  <th>Thợ Barber</th>
                  <th>Chi nhánh</th>
                  <th>Doanh thu tạo ra</th>
                  <th>Tổng thu nhập (+)</th>
                  <th>Khấu trừ (-)</th>
                  <th>Thực nhận</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "center" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalaries.length > 0 ? filteredSalaries.map((s, idx) => {
                  const totalIncome = (s.baseSalary || 0) + (s.commission || 0) + (s.tip || 0) + (s.bonus || 0);
                  const deductions = s.deductions || 0; 
                  const netSalary = totalIncome - deductions;
                  const currentStatus = s.status || "Bản nháp";

                  return (
                    <tr key={idx} className={cx({ "row-disputed": currentStatus === "Có khiếu nại" })}>
                      <td>
                        <div className={cx("employee")}>
                          <div className={cx("avatar")}>{(s.barberName || "U").charAt(0).toUpperCase()}</div>
                          <span className={cx("empName")}>{s.barberName}</span>
                        </div>
                      </td>
                      <td>{s.branchName}</td>
                      <td className={cx("text-muted")}>{Number(s.serviceRevenue || 0).toLocaleString()}đ</td>
                      <td className={cx("text-success")}>+{Number(totalIncome).toLocaleString()}đ</td>
                      <td className={cx("text-danger")}>-{Number(deductions).toLocaleString()}đ</td>
                      <td className={cx("highlight")}>{Number(netSalary).toLocaleString()}đ</td>
                      <td>
                        <span className={cx("statusBadge", getStatusClass(currentStatus))}>
                          {currentStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
                        
                        {/* Đã bỏ điều kiện: Nút Xem khiếu nại luôn hiện để test */}
                        <button 
                          className={cx("btn-icon", "warn")} 
                          onClick={() => showDisputeReason(s.disputeReason || "Chưa có nội dung khiếu nại (Test)")}
                          title="Xem lý do khiếu nại"
                        >
                          <FontAwesomeIcon icon={faCircleExclamation} />
                        </button>

                        {/* Đã bỏ điều kiện: Nút Điều chỉnh Khấu trừ luôn hiện để test */}
                        <button 
                          className={cx("btn-icon")} 
                          onClick={() => setEditingDeduction(s)}
                          title="Điều chỉnh Khấu trừ"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} />
                        </button>

                        {/* Nút Xem Phiếu lương */}
                        <button 
                          className={cx("btn-icon")} 
                          onClick={() => setSelectedBarber(s)}
                          title="Xem phiếu lương"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>

                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px 0", color: "#999" }}>
                      Chưa có dữ liệu bảng lương tháng này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBarber && (
        <PayslipModal 
          data={selectedBarber} 
          month={month} 
          year={year} 
          onClose={() => setSelectedBarber(null)} 
        />
      )}

      {editingDeduction && (
        <DeductionModal 
          data={editingDeduction} 
          onClose={() => setEditingDeduction(null)} 
          onSave={handleSaveDeduction}
        />
      )}
    </div>
  );
}

export default LuongThuong;