import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./HopDong.module.scss";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { ContractAPI } from "~/apis/contractAPI";

const cx = classNames.bind(styles);

const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN");
const fmtDate = (d) => {
  if (!d) return "................................";
  const date = new Date(d);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

const getContractDuration = (start, end) => {
  if (!end) return "Vô thời hạn";
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = Math.abs(d2 - d1);
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return `${diffMonths} tháng`;
};

function ContractDocument({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const res = await ContractAPI.getMyContract();

        // Map data từ API vào đúng shape component cần
        setData({
          idContract:       res.idSalaryContract,
          startDate:        res.startDate,
          endDate:          res.endDate,
          actualBaseSalary: res.actualBaseSalary,
          status:           res.status,
          user: {
            fullName:    res.barber.user.fullName,
            phoneNumber: res.barber.user.phoneNumber,
            email:       res.barber.user.email,
            image:       res.barber.user.image,
          },
          barber: {
            experienceYears: res.barber.experienceYears,
            specialty:       res.barber.specialty,
            style:           res.barber.style,
          },
          branch: {
            name:    res.barber.branch.name,
            address: res.barber.branch.address,
          },
          plan: {
            displayName:           res.plan.displayName,
            roleType:              res.plan.roleType,
            minRevenueToPromote:   res.plan.minRevenueToPromote,
            evaluationPeriodMonths: res.plan.evaluationPeriodMonths,
          },
        });
      } catch (err) {
        setError(err?.message || "Không thể tải hợp đồng");
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, []);

  // ── Trạng thái loading ──
  if (loading) {
    return (
      <div className={cx("contractPage", "centered")}>
        <p>Đang tải hợp đồng...</p>
      </div>
    );
  }

  // ── Trạng thái lỗi ──
  if (error || !data) {
    return (
      <div className={cx("contractPage", "centered")}>
        <p className={cx("error")}>{error || "Không tìm thấy hợp đồng"}</p>
        <button className={cx("btn", "ghost")} onClick={onBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className={cx("contractPage")}>
      {/* Thanh công cụ */}
      <div className={cx("toolbar", "no-print")}>
        <button className={cx("btn", "ghost")} onClick={onBack}>
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div className={cx("actions")}>
          <button className={cx("btn", "outline")} onClick={() => window.print()}>
            <Printer size={16} /> In hợp đồng
          </button>
          <button className={cx("btn", "primary")}>
            <Download size={16} /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Tờ giấy A4 */}
      <div className={cx("a4-paper")}>
        {data.status === "active"     && <div className={cx("stamp", "active")}>ĐANG HIỆU LỰC</div>}
        {data.status === "closed"     && <div className={cx("stamp", "expired")}>ĐÃ HẾT HẠN</div>}
        {data.status === "terminated" && <div className={cx("stamp", "terminated")}>ĐÃ CHẤM DỨT</div>}

        <div className={cx("header")}>
          <div className={cx("national-motto")}>
            <h4>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h4>
            <p>Độc lập - Tự do - Hạnh phúc</p>
            <div className={cx("line")}></div>
          </div>
          <h2 className={cx("title")}>HỢP ĐỒNG LAO ĐỘNG</h2>
          <p className={cx("contract-number")}>Số: {data.idContract}/HĐLĐ-SALON</p>
        </div>

        <div className={cx("content")}>
          <p>
            Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm{" "}
            {new Date().getFullYear()}, tại{" "}
            <strong>{data.branch.name} — {data.branch.address}</strong>, chúng tôi gồm có:
          </p>

          <h3 className={cx("section-title")}>BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG (CHỦ SALON)</h3>
          <ul className={cx("info-list")}>
            <li><strong>Tên hệ thống/Salon:</strong> BARBER SHOP SYSTEM</li>
            <li>
              <strong>Đại diện bởi Ông/Bà:</strong> Trần Văn Boss &nbsp;&nbsp;&nbsp;&nbsp;
              <strong>Chức vụ:</strong> Giám đốc
            </li>
            <li><strong>Địa chỉ trụ sở:</strong> {data.branch.address}</li>
            <li><strong>Điện thoại:</strong> 0999.999.999</li>
          </ul>

          <h3 className={cx("section-title")}>BÊN B: NGƯỜI LAO ĐỘNG (THỢ LÀM TÓC)</h3>
          <ul className={cx("info-list")}>
            <li>
              <strong>Ông/Bà:</strong>{" "}
              <span className={cx("highlight")}>{data.user.fullName}</span>
            </li>
            <li><strong>Số điện thoại:</strong> {data.user.phoneNumber || "................................"}</li>
            <li><strong>Email:</strong> {data.user.email || "................................"}</li>
            <li><strong>Số năm kinh nghiệm:</strong> {data.barber.experienceYears || 0} năm</li>
          </ul>

          <p>Hai bên thỏa thuận ký kết hợp đồng lao động này với các điều khoản sau đây:</p>

          <h3 className={cx("article-title")}>ĐIỀU 1: THỜI HẠN VÀ CÔNG VIỆC HỢP ĐỒNG</h3>
          <ul className={cx("clause-list")}>
            <li>
              <strong>Loại hợp đồng:</strong> Hợp đồng có thời hạn (
              {getContractDuration(data.startDate, data.endDate)}).
            </li>
            <li>
              <strong>Từ ngày:</strong> {fmtDate(data.startDate)} &nbsp;&nbsp;&nbsp;&nbsp;
              <strong>Đến ngày:</strong> {fmtDate(data.endDate)}
            </li>
            <li>
              <strong>Chức danh chuyên môn:</strong>{" "}
              <span className={cx("highlight")}>{data.plan.displayName}</span>
            </li>
            <li>
              <strong>Chuyên môn chính:</strong>{" "}
              {data.barber.specialty || "Phục vụ cắt tóc nam nữ tổng hợp"}.
            </li>
            <li>
              <strong>Nhiệm vụ công việc:</strong> Thực hiện các dịch vụ tư vấn, cắt, uốn, nhuộm,
              tạo kiểu cho khách hàng. Đảm bảo vệ sinh khu vực làm việc cá nhân và tuân thủ các
              quy chuẩn dịch vụ của Salon.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 2: CHẾ ĐỘ LÀM VIỆC VÀ MỨC LƯƠNG</h3>
          <ul className={cx("clause-list")}>
            <li>
              <strong>Lương cơ bản (Lương cứng):</strong>{" "}
              <span className={cx("highlight")}>{fmtMoney(data.actualBaseSalary)} VNĐ/tháng</span>.
            </li>
            <li>
              <strong>Hoa hồng & Thưởng KPI:</strong> Được tính theo chính sách hoa hồng của cấp
              bậc <strong>{data.plan.displayName}</strong> hiện hành của hệ thống. Chính sách này
              có thể được cập nhật theo kỳ đánh giá{" "}
              <strong>{data.plan.evaluationPeriodMonths} tháng/lần</strong>.
            </li>
            <li>
              <strong>Thời gian làm việc:</strong> Theo ca làm việc được sắp xếp hàng tuần bởi
              Quản lý chi nhánh (Đảm bảo nghỉ 01 ngày/tuần).
            </li>
            <li>
              <strong>Hình thức trả lương:</strong> Chuyển khoản ngân hàng vào ngày 10 hàng tháng.
            </li>
            <li>
              <strong>Trang thiết bị:</strong> Bên A cung cấp ghế cắt, gương, hóa chất và thiết bị
              chung. Bên B tự trang bị bộ dụng cụ hành nghề cá nhân (kéo, tông đơ, lược) đúng tiêu
              chuẩn.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 3: NGHĨA VỤ VÀ QUYỀN LỢI CỦA BÊN B</h3>
          <ul className={cx("clause-list")}>
            <li>
              <strong>Quyền lợi:</strong> Được đánh giá thăng cấp thường xuyên dựa trên doanh thu
              và lượt khách. Được đào tạo nâng cao tay nghề định kỳ.
            </li>
            <li>
              <strong>Nghĩa vụ:</strong> Tuân thủ nội quy, giờ giấc làm việc. Giao tiếp lịch sự,
              không chèo kéo hoặc có hành vi gian lận doanh thu, đánh cắp thông tin khách hàng của
              Salon dưới mọi hình thức.
            </li>
            <li>
              <strong>Bảo mật:</strong> Tuyệt đối không tự ý lấy thông tin liên lạc cá nhân của
              khách hàng để phục vụ mục đích riêng.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 4: NGHĨA VỤ VÀ QUYỀN LỢI CỦA BÊN A</h3>
          <ul className={cx("clause-list")}>
            <li>
              Đảm bảo việc làm, tạo môi trường làm việc chuyên nghiệp, cung cấp đầy đủ lượng khách
              hàng marketing cho Bên B.
            </li>
            <li>
              Thanh toán đầy đủ, đúng hạn các khoản lương, thưởng hoa hồng cho Bên B như đã thỏa
              thuận.
            </li>
            <li>
              Có quyền tạm ngưng hoặc chấm dứt hợp đồng trước thời hạn (theo đúng quy định) nếu
              Bên B vi phạm nghiêm trọng nội quy Salon.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 5: ĐIỀU KHOẢN THI HÀNH</h3>
          <ul className={cx("clause-list")}>
            <li>
              Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản
              để thực hiện.
            </li>
            <li>
              Mọi sửa đổi, bổ sung (bao gồm việc thăng hạng, tăng lương) phải được lập thành Phụ
              lục hợp đồng hoặc Hợp đồng mới.
            </li>
          </ul>
        </div>

        <div className={cx("signatures")}>
          <div className={cx("sign-box")}>
            <h4>BÊN B</h4>
            <p>(Người lao động ký & ghi rõ họ tên)</p>
            <div className={cx("space")}></div>
            <p className={cx("name")}>{data.user.fullName}</p>
          </div>
          <div className={cx("sign-box")}>
            <h4>BÊN A</h4>
            <p>(Đại diện Salon ký & đóng dấu)</p>
            <div className={cx("space")}></div>
            <p className={cx("name")}>Trần Văn Boss</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractDocument;