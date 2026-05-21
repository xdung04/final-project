import { useEffect, useState } from "react";
import classNames from "classnames/bind";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import {
  fetchMyVouchers,
  fetchExchangeableVouchers,
  fetchActiveCampaigns,
  exchangeVoucher,
  collectCampaignVoucher,
  fetchCustomerPoints,
} from "~/services/voucherService";
import styles from "./MyVouchers.module.scss";

const cx = classNames.bind(styles);

const TYPE_LABEL = {
  NEW_CUSTOMER: "Khách mới",
  POINTS_EXCHANGE: "Đổi điểm",
  RETENTION: "Quà tặng khách hàng",
  CAMPAIGN: "Khuyến mãi",
};

const TYPE_COLOR = {
  NEW_CUSTOMER: "#4ade80",
  POINTS_EXCHANGE: "#60a5fa",
  RETENTION: "#f59e0b",
  CAMPAIGN: "#c084fc",
};

const SOURCE_LABEL = {
  new_customer_welcome: "Voucher chào mừng",
  retention_gift: "Quà tri ân",
  campaign_collect: "Nhận từ chiến dịch",
  exchange: "Đổi điểm",
};

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
}

function formatMoney(amount) {
  return Number(amount).toLocaleString("vi-VN") + "đ";
}

function formatDate(dateStr) {
  if (!dateStr) return "Không giới hạn";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function VoucherCard({ cv, dim = false }) {
  const { voucher, status, expires_at, source_note } = cv;
  const days = daysLeft(expires_at);
  const urgent = days !== null && days <= 3 && status === "AVAILABLE";
  const color = TYPE_COLOR[voucher?.type] || "#b8966a";

  return (
    <div className={cx("vcard", { dim, urgent })}>
      <div className={cx("vcard-left")} style={{ "--accent": color }}>
        <span className={cx("vcard-percent")}>
          {voucher?.discount_percent}%
        </span>
        <span className={cx("vcard-off")}>GIẢM</span>
      </div>
      <div className={cx("vcard-divider")}>
        <span className={cx("hole", "hole-top")} />
        <div className={cx("dash-line")} />
        <span className={cx("hole", "hole-bot")} />
      </div>
      <div className={cx("vcard-right")}>
        <div
          className={cx("vcard-badge")}
          style={{ color, borderColor: color }}
        >
          {TYPE_LABEL[voucher?.type] || "Voucher"}
        </div>
        <div className={cx("vcard-name")}>{voucher?.name}</div>
        <div className={cx("vcard-meta")}>
          <span>Giảm tối đa {formatMoney(voucher?.max_discount_amount)}</span>
          <span>Đơn từ {formatMoney(voucher?.min_invoice_amount)}</span>
        </div>
        {source_note && (SOURCE_LABEL[source_note] || source_note) && (
          <div className={cx("vcard-source")}>
            {SOURCE_LABEL[source_note] || source_note}
          </div>
        )}
        <div className={cx("vcard-footer")}>
          {status === "AVAILABLE" && (
            <span className={cx("vcard-expire", { urgent })}>
              {days === null
                ? "Không hết hạn"
                : urgent
                  ? `⚡ Còn ${days} ngày!`
                  : `HSD: ${formatDate(expires_at)}`}
            </span>
          )}
          {status === "USED" && (
            <span className={cx("vcard-used")}>✓ Đã sử dụng</span>
          )}
          {status === "EXPIRED" && (
            <span className={cx("vcard-expired")}>✕ Hết hạn</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onCollect, collecting }) {
  const days = daysLeft(campaign.end_date);
  const progress = campaign.total_quantity
    ? Math.round((campaign.issued_count / campaign.total_quantity) * 100)
    : 0;

  return (
    <div className={cx("ccard")}>
      <div className={cx("ccard-top")}>
        <div className={cx("ccard-badge")}>CAMPAIGN</div>
        <div className={cx("ccard-name")}>{campaign.name || "Chiến dịch"}</div>
        <div className={cx("ccard-percent")}>{campaign.discount_percent}%</div>
        <div className={cx("ccard-subtext")}>
          giảm tối đa {formatMoney(campaign.max_discount_amount)}
        </div>
      </div>
      <div className={cx("ccard-meta")}>
        <span>Đơn từ {formatMoney(campaign.min_invoice_amount)}</span>
        {days !== null && <span>Còn {days} ngày</span>}
      </div>
      {campaign.total_quantity && (
        <div className={cx("ccard-progress")}>
          <div className={cx("progress-bar")}>
            <div
              className={cx("progress-fill")}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={cx("progress-text")}>
            Còn lại {campaign.total_quantity - campaign.issued_count}/
            {campaign.total_quantity}
          </span>
        </div>
      )}
      <button
        className={cx("collect-btn")}
        onClick={() => onCollect(campaign.id)}
        disabled={collecting === campaign.id}
      >
        <span>
          {collecting === campaign.id ? "Đang thu thập..." : "Thu thập ngay"}
        </span>
      </button>
    </div>
  );
}

function ExchangeCard({ voucher, points, onExchange, exchanging }) {
  const canExchange = voucher.can_exchange;
  const reason = voucher.reason;

  const getButtonText = () => {
    if (!voucher.is_active) return "Không khả dụng";
    if (!canExchange) {
      if (reason === "not_enough_points") return "Không đủ điểm";
      if (reason === "max_exchanged") return "Đã đủ số lần";
      if (reason === "has_available") return "Đang có voucher chưa dùng";
      return "Không thể đổi";
    }
    return exchanging === voucher.id ? "Đang đổi..." : "Đổi ngay";
  };

  const isDisabled = !canExchange || exchanging === voucher.id;

  return (
    <div className={cx("ecard", { disabled: !canExchange })}>
      <div className={cx("ecard-percent")}>{voucher.discount_percent}%</div>
      <div className={cx("ecard-name")}>{voucher.name}</div>
      <div className={cx("ecard-meta")}>
        <span>Giảm tối đa {formatMoney(voucher.max_discount_amount)}</span>
        <span>Đơn từ {formatMoney(voucher.min_invoice_amount)}</span>
      </div>
      <div className={cx("ecard-cost")}>
        <span className={cx("cost-value", { unaffordable: !canExchange })}>
          {voucher.points_required}
        </span>
        <span className={cx("cost-label")}>điểm</span>
      </div>
      <button
        className={cx("exchange-btn", { disabled: isDisabled })}
        onClick={() => canExchange && onExchange(voucher)}
        disabled={isDisabled}
      >
        <span>{getButtonText()}</span>
      </button>
    </div>
  );
}

function ConfirmModal({ voucher, points, onConfirm, onCancel }) {
  if (!voucher) return null;
  return (
    <div className={cx("modal-overlay")} onClick={onCancel}>
      <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
        <div className={cx("modal-title")}>Xác nhận đổi điểm</div>
        <div className={cx("modal-voucher-name")}>{voucher.name}</div>
        <div className={cx("modal-rows")}>
          <div className={cx("modal-row")}>
            <span>Điểm hiện tại</span>
            <span>{points}</span>
          </div>
          <div className={cx("modal-row", "deduct")}>
            <span>Điểm bị trừ</span>
            <span>− {voucher.points_required}</span>
          </div>
          <div className={cx("modal-divider")} />
          <div className={cx("modal-row", "remain")}>
            <span>Điểm còn lại</span>
            <span>{points - voucher.points_required}</span>
          </div>
        </div>
        <div className={cx("modal-actions")}>
          <button className={cx("modal-cancel")} onClick={onCancel}>
            Huỷ
          </button>
          <button className={cx("modal-confirm")} onClick={onConfirm}>
            Xác nhận đổi
          </button>
        </div>
      </div>
    </div>
  );
}

function MyVouchers() {
  const { accessToken, user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("available");
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [exchangeable, setExchangeable] = useState([]);

  const [points, setPoints] = useState(0);

  const [collecting, setCollecting] = useState(null);
  const [exchanging, setExchanging] = useState(null);
  const [confirmVoucher, setConfirmVoucher] = useState(null);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [av, ca, ex, pts] = await Promise.all([
        fetchMyVouchers(accessToken),
        fetchActiveCampaigns(accessToken),
        fetchExchangeableVouchers(accessToken),
        fetchCustomerPoints(accessToken),
      ]);
      setAvailable(av);
      setCampaigns(ca);
      setExchangeable(ex);
      setPoints(pts);
    } catch (err) {
      console.error(err);
      showToast({
        text: "Lỗi tải dữ liệu voucher",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const handleCollect = async (voucherId) => {
    setCollecting(voucherId);
    try {
      await collectCampaignVoucher(accessToken, voucherId);
      showToast({
        text: "Thu thập voucher thành công!",
        type: "success",
        duration: 3000,
      });
      const [av, ca] = await Promise.all([
        fetchMyVouchers(accessToken),
        fetchActiveCampaigns(accessToken),
      ]);
      setAvailable(av);
      setCampaigns(ca);
    } catch (err) {
      showToast({
        text: err.response?.data?.message || "Có lỗi xảy ra!",
        type: "error",
        duration: 3000,
      });
    } finally {
      setCollecting(null);
    }
  };

  const handleExchangeConfirm = async () => {
    if (!confirmVoucher) return;
    const id = confirmVoucher.id;
    setExchanging(id);
    setConfirmVoucher(null);
    try {
      await exchangeVoucher(accessToken, id);
      showToast({
        text: "Đổi voucher thành công!",
        type: "success",
        duration: 3000,
      });
      const [av, ex] = await Promise.all([
        fetchMyVouchers(accessToken),
        fetchExchangeableVouchers(accessToken),
      ]);
      setAvailable(av);
      setExchangeable(ex);
    } catch (err) {
      showToast({
        text: err.response?.data?.message || "Có lỗi xảy ra!",
        type: "error",
        duration: 3000,
      });
    } finally {
      setExchanging(null);
    }
  };

  const tabs = [
    { key: "available", label: "Có thể dùng", count: available.length },
    { key: "campaign", label: "Thu thập", count: campaigns.length },
    { key: "exchange", label: "Đổi điểm", count: exchangeable.length },
  ];

  if (loading) return <div className={cx("loading")}>Đang tải...</div>;

  return (
    <div className={cx("wrapper")}>
      <div className={cx("grainOverlay")} />
      <div className={cx("innerContainer")}>
        <div className={cx("sectionLabel")}>VOUCHER & ƯU ĐÃI</div>
        <h1 className={cx("title")}>
          Kho <em>Voucher</em> của tôi
        </h1>

        <div className={cx("layout")}>
          <div className={cx("sidebar")}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={cx("menu-item", { active: activeTab === tab.key })}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={cx("badge")}>{tab.count}</span>
                )}
              </button>
            ))}
            <div className={cx("sidebar-points")}>
              <span className={cx("sp-label")}>ĐIỂM TÍCH LŨY</span>
              <span className={cx("sp-value")}>{points}</span>
              <span className={cx("sp-sub")}>điểm</span>
            </div>
          </div>

          <div className={cx("content")}>
            {activeTab === "available" && (
              <div>
                <div className={cx("content-header")}>
                  <h2>
                    Voucher <em>khả dụng</em>
                  </h2>
                  <p>Áp dụng khi đặt lịch tại bước thanh toán</p>
                </div>
                {available.length === 0 ? (
                  <div className={cx("empty")}>
                    <div className={cx("empty-icon")}>🎟</div>
                    <p>Bạn chưa có voucher nào có thể sử dụng</p>
                  </div>
                ) : (
                  <div className={cx("vcard-list")}>
                    {available.map((cv) => (
                      <VoucherCard key={cv.id} cv={cv} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "campaign" && (
              <div>
                <div className={cx("content-header")}>
                  <h2>
                    Chiến dịch <em>đang diễn ra</em>
                  </h2>
                  <p>Bấm thu thập để nhận voucher vào kho</p>
                </div>
                {campaigns.length === 0 ? (
                  <div className={cx("empty")}>
                    <div className={cx("empty-icon")}>🎪</div>
                    <p>
                      Hiện không có chiến dịch nào hoặc bạn đã thu thập tất cả
                    </p>
                  </div>
                ) : (
                  <div className={cx("ccard-grid")}>
                    {campaigns.map((c) => (
                      <CampaignCard
                        key={c.id}
                        campaign={c}
                        onCollect={handleCollect}
                        collecting={collecting}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "exchange" && (
              <div>
                <div className={cx("content-header")}>
                  <h2>
                    Đổi <em>điểm thưởng</em>
                  </h2>
                  <p>Dùng điểm tích lũy để đổi lấy voucher giảm giá</p>
                </div>
                <div className={cx("points-banner")}>
                  <span className={cx("pb-label")}>Điểm hiện tại</span>
                  <span className={cx("pb-value")}>{points}</span>
                  <span className={cx("pb-unit")}>điểm</span>
                </div>
                {exchangeable.length === 0 ? (
                  <div className={cx("empty")}>
                    <div className={cx("empty-icon")}>💎</div>
                    <p>Không có voucher nào để đổi hoặc bạn đã đổi tối đa</p>
                  </div>
                ) : (
                  <div className={cx("ecard-grid")}>
                    {exchangeable.map((v) => (
                      <ExchangeCard
                        key={v.id}
                        voucher={v}
                        points={points}
                        onExchange={setConfirmVoucher}
                        exchanging={exchanging}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        voucher={confirmVoucher}
        points={points}
        onConfirm={handleExchangeConfirm}
        onCancel={() => setConfirmVoucher(null)}
      />
    </div>
  );
}

export default MyVouchers;
