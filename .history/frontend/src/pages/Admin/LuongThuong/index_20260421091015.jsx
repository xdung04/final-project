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

  // GIAI ĐOẠN 1: TÍNH LƯƠNG NHÁP
  const calculateSalary = async () => {
    setLoading(true);
    try {
      await SalaryAPI.calculateSalaries(month, year);
      alert("Đã cập nhật số liệu bảng lương nháp!");
      fetchData(month, year);
    } catch (err) {
      alert("Tính lương thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // GIAI ĐOẠN 2 & 3: GỬI PHIẾU LƯƠNG (Cả hàng loạt và đơn lẻ)
  const handleSendPayslips = async (barberId = null) => {
    const msg = barberId ? "Gửi lại phiếu lương cho thợ này?" : "Gửi phiếu lương hàng loạt cho cả tiệm?";
    if (!window.confirm(msg)) return;

    try {
      // Giả sử API hỗ trợ barberId null để gửi tất cả
      await SalaryAPI.sendPayslips({ month, year, barberId });
      alert("Đã gửi! Trạng thái chuyển sang Chờ xác nhận.");
      fetchData(month, year);
    } catch (error) {
      alert("Lỗi khi gửi phiếu lương!");
    }
  };

  // GIAI ĐOẠN 4: THANH TOÁN & KHÓA SỔ
  const handleMarkAsPaid = async (barberId) => {
    if (!window.confirm("Xác nhận đã thanh toán? Dữ liệu thợ này sẽ bị KHÓA vĩnh viễn.")) return;

    try {
      await SalaryAPI.markAsPaid({ month, year, barberId });
      alert("Đã thanh toán thành công!");
      fetchData(month, year);
    } catch (error) {
      alert("Lỗi khi chốt thanh toán!");
    }
  };

  const handleSaveDeduction = async (payload) => {
    try {
      await SalaryAPI.updateDeduction(payload);
      alert("Cập nhật thành công!");
      setEditingDeduction(null);
      fetchData(month, year);
    } catch (error) {
      alert("Lỗi khi cập nhật!");
    }
  };

  const showDisputeReason = (reason) => {
    alert(`LÝ DO KHIẾU NẠI:\n"${reason || "Không có nội dung chi tiết"}"`);
  };

  const monthOverview = overview.find(item => item.month === month && item.year === year);
  const isLocked = monthOverview?.isLocked || false;

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
              {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>Tháng {i + 1}</option>))}
            </select>
            <select className={cx("selectBox")} value={year} onChange={e => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => (<option key={i} value={2023 + i}>{2023 + i}</option>))}
            </select>
            
            <button className={cx("btn-outline")} onClick={() => fetchData(month, year)} disabled={loading}>
              <FontAwesomeIcon icon={faArrowTrendUp} /> Làm mới
            </button>
            
            {!isLocked && (
              <>
                <button className={cx("btn-primary")} onClick={calculateSalary} disabled={loading}>
                  <FontAwesomeIcon icon={faCalculator} /> Tính lương nháp
                </button>
                <button className={cx("btn-action")} onClick={() => handleSendPayslips()} disabled={loading}>
                  <FontAwesomeIcon icon={faPaperPlane} /> Gửi hàng loạt
                </button>
              </>
            )}
          </div>

          <div className={cx("searchBox")}>
            <input type="text" placeholder="Tìm thợ..." value={search} onChange={e => setSearch(e.target.value)} />
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </div>
        </div>
      </div>

      <div className={cx("salaryTableWrapper")}>
        <div className={cx("tableContainer")}>
          <table>
            <thead>
              <tr>
                <th>Thợ Barber</th>
                <th>Tổng thu nhập (+)</th>
                <th>Khấu trừ (-)</th>
                <th>Thực nhận</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: "center" }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {salaries.filter(s => s.barberName.toLowerCase().includes(search.toLowerCase())).map((s, idx) => {
                const status = s.status || "Bản nháp";
                
                // LOGIC FLOW QUAN TRỌNG
                const isDraft = status === "Bản nháp";
                const isPending = status === "Chờ xác nhận";
                const isDisputed = status === "Có khiếu nại";
                const isConfirmed = status === "Đã xác nhận";
                const isPaid = status === "Đã thanh toán";

                // Chỉ cho phép sửa khi là Nháp hoặc Thợ đang khiếu nại
                const canEdit = isDraft || isDisputed; 

                return (
                  <tr key={idx} className={cx({ "row-disputed": isDisputed, "row-confirmed": isConfirmed, "row-paid": isPaid })}>
                    <td>
                      <div className={cx("employee")}>
                        <div className={cx("avatar")}>{s.barberName.charAt(0)}</div>
                        <span className={cx("empName")}>{s.barberName}</span>
                      </div>
                    </td>
                    <td className={cx("text-success")}>+{Number(s.totalIncome || 0).toLocaleString()}đ</td>
                    <td className={cx("text-danger")}>-{Number(s.deductions || 0).toLocaleString()}đ</td>
                    <td className={cx("highlight")}>{Number(s.netSalary || 0).toLocaleString()}đ</td>
                    <td>
                      <span className={cx("statusBadge", getStatusClass(status))}>
                        {isPaid && <FontAwesomeIcon icon={faLock} style={{marginRight: '4px'}} />}
                        {status}
                      </span>
                    </td>
                    <td className={cx("action-cell")}>
                      
                      {/* 1. XỬ LÝ KHIẾU NẠI (Chỉ hiện khi thợ báo lỗi) */}
                      {isDisputed && (
                        <button className={cx("btn-icon", "warn")} onClick={() => showDisputeReason(s.disputeReason)} title="Xem khiếu nại">
                          <FontAwesomeIcon icon={faCircleExclamation} />
                        </button>
                      )}

                      {/* 2. ĐIỀU CHỈNH (Khóa khi đang chờ thợ xác nhận hoặc đã trả lương) */}
                      <button 
                        className={cx("btn-icon")} 
                        onClick={() => setEditingDeduction(s)}
                        disabled={!canEdit}
                        title={canEdit ? "Điều chỉnh khấu trừ" : "Bị khóa - Đang chờ thợ hoặc đã thanh toán"}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>

                      {/* 3. GỬI PHIẾU (Hiện khi là nháp hoặc sau khi đã sửa lỗi khiếu nại xong) */}
                      {canEdit && (
                        <button className={cx("btn-icon", "primary")} onClick={() => handleSendPayslips(s.barberId)} title="Gửi phiếu lương">
                          <FontAwesomeIcon icon={faPaperPlane} />
                        </button>
                      )}

                      {/* 4. THANH TOÁN (Chỉ hiện khi thợ đã bấm Xác nhận) */}
                      {isConfirmed && (
                        <button className={cx("btn-icon", "success")} onClick={() => handleMarkAsPaid(s.barberId)} title="Đánh dấu đã trả lương">
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                        </button>
                      )}

                      {/* 5. XEM CHI TIẾT (Luôn hiện) */}
                      <button className={cx("btn-icon")} onClick={() => setSelectedBarber(s)} title="Xem chi tiết">
                        <FontAwesomeIcon icon={faEye} />
                      </button>

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBarber && <PayslipModal data={selectedBarber} month={month} year={year} onClose={() => setSelectedBarber(null)} />}
      {editingDeduction && <DeductionModal data={editingDeduction} onSave={handleSaveDeduction} onClose={() => setEditingDeduction(null)} />}
    </div>
  );
}

export default LuongThuong;