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

        // Map data từ API
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

  if (loading) {
    return (
      <div className={cx("contractPage", "centered")}>
        <p>Đang tải hợp đồng...</p>
      </div>
    );
  }

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
          <h2 className={cx("title")}>HỢP ĐỒNG LAO ĐỘNG VÀ HỢP TÁC DOANH THU</h2>
          <p className={cx("contract-number")}>Số: {data.idContract}/HĐ-BARBERSHOP</p>
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

          <p>Hai bên thống nhất ký kết hợp đồng với các điều khoản minh bạch sau đây:</p>

          <h3 className={cx("article-title")}>ĐIỀU 1: THỜI HẠN VÀ CÔNG VIỆC</h3>
          <ul className={cx("clause-list")}>
            <li>
              <strong>Cấp bậc hiện tại:</strong>{" "}
              <span className={cx("highlight")}>{data.plan.displayName}</span>
            </li>
            <li>
              <strong>Thời hạn Hợp đồng:</strong> {getContractDuration(data.startDate, data.endDate)}
              <br />Từ ngày: <strong>{fmtDate(data.startDate)}</strong> đến ngày: <strong>{fmtDate(data.endDate)}</strong>.
            </li>
            <li>
              <strong>Nhiệm vụ:</strong> Thực hiện các dịch vụ tư vấn, cắt, uốn, nhuộm. Đảm bảo vệ sinh khu vực làm việc và tuân thủ quy chuẩn dịch vụ của hệ thống.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 2: CƠ CHẾ LƯƠNG ĐỊNH KỲ VÀ THĂNG TIẾN (LÊN CẤP)</h3>
          <ul className={cx("clause-list")}>
            <li>
              <strong>1. Lương cứng (Base Salary):</strong>{" "}
              <span className={cx("highlight")}>{fmtMoney(data.actualBaseSalary)} VNĐ/tháng</span> (Áp dụng cho tháng làm việc trọn vẹn).
            </li>
            <li>
              <strong>2. Hoa hồng & Thưởng (Commission & KPI):</strong> Áp dụng theo tỷ lệ của cấp bậc <strong>{data.plan.displayName}</strong>. Tiền lương định kỳ được chốt vào ngày cuối cùng của tháng, Bên B có 02 ngày để kiểm tra bảng lương trước khi Bên A tiến hành thanh toán.
            </li>
            <li>
              <strong>3. Điều kiện thăng tiến (Lên cấp):</strong> Vào cuối mỗi tháng, nếu tổng doanh thu dịch vụ của Bên B đạt từ{" "}
              <span className={cx("highlight")}>{fmtMoney(data.plan.minRevenueToPromote)} VNĐ</span> trở lên, hệ thống sẽ tự động ghi nhận đủ điều kiện lên cấp. Hợp đồng mới (với mức lương/hoa hồng cao hơn) sẽ tự động có hiệu lực kể từ <strong>ngày 01 của tháng tiếp theo</strong>.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 3: QUY ĐỊNH QUYẾT TOÁN KHI CHẤM DỨT HỢP ĐỒNG</h3>
          <p className={cx("sub-text")}>Để đảm bảo công bằng và minh bạch, nếu Bên B xin nghỉ việc hoặc bị chấm dứt hợp đồng giữa chừng (không trọn vẹn tháng), lương quyết toán được tính như sau:</p>
          <ul className={cx("clause-list")}>
            <li>
              <strong>1. Về Lương cứng:</strong> Được chia theo tỷ lệ ngày thực tế. <br/>
              <em>Công thức = (Lương cứng / Tổng số ngày trong tháng) * Số ngày hợp đồng có hiệu lực trong tháng đó.</em>
            </li>
            <li>
              <strong>2. Về Hoa hồng:</strong> Bên B nhận đủ 100% tiền hoa hồng tính trên doanh thu thực tế phát sinh từ đầu tháng đến ngày chấm dứt hợp đồng.
            </li>
            <li>
              <strong>3. Về Thưởng KPI:</strong> Bị hủy bỏ (Bằng 0 VNĐ). Do tính chất thưởng KPI nhằm khích lệ cống hiến trọn vẹn tháng, việc nghỉ giữa chừng sẽ không được áp dụng khoản thưởng này.
            </li>
            <li>
              <strong>4. Nghĩa vụ tồn đọng:</strong> Bên B không được phép chấm dứt hợp đồng nếu đang có Lịch hẹn (Booking) của khách hàng trong tương lai. Mọi lịch hẹn phải được hoàn tất hoặc chuyển giao cho thợ khác thông qua hệ thống trước khi nghỉ việc.
            </li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 4: NGHĨA VỤ VÀ QUYỀN LỢI CHUNG</h3>
          <ul className={cx("clause-list")}>
            <li><strong>Môi trường làm việc:</strong> Bên A đảm bảo cung cấp lượng khách hàng, hóa chất, thiết bị lớn. Bên B tự trang bị dụng cụ hành nghề cá nhân (kéo, tông đơ...).</li>
            <li><strong>Bảo mật & Tác phong:</strong> Bên B tuyệt đối không tự ý lấy thông tin cá nhân của khách hàng để phục vụ mục đích riêng, không chèo kéo hoặc có hành vi gian lận doanh thu.</li>
          </ul>

          <h3 className={cx("article-title")}>ĐIỀU 5: ĐIỀU KHOẢN THI HÀNH</h3>
          <ul className={cx("clause-list")}>
            <li>Hợp đồng này được lập thành 02 bản có giá trị pháp lý như nhau.</li>
            <li>Hệ thống phần mềm của Salon là công cụ lưu trữ dữ liệu chính thức, số liệu chốt trên phần mềm là số liệu cuối cùng để giải quyết các vấn đề tài chính.</li>
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