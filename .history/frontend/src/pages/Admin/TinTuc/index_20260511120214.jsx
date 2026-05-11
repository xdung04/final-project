import React, { useState, useEffect, useCallback } from "react";
import styles from "./TinTuc.module.scss";
import { NewsAPI } from "~/apis/newsAPI";
import { useAuth } from "~/context/AuthContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  NEWS:      { label: "Tin tức",    mod: "news" },
  PROMOTION: { label: "Khuyến mãi", mod: "promo" },
  STYLE:     { label: "Phong cách", mod: "style" },
};

const FILTER_TABS = [
  { value: "ALL",       label: "Tất cả" },
  { value: "STYLE",     label: "Phong cách" },
  { value: "NEWS",      label: "Tin tức" },
  { value: "PROMOTION", label: "Khuyến mãi" },
];

const EMPTY_FORM = {
  title: "", slug: "", summary: "", content: "",
  category: "STYLE", status: "DRAFT", thumbnail: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(str) {
  const map = {
    à:"a",á:"a",â:"a",ã:"a",ä:"a",è:"e",é:"e",ê:"e",ë:"e",
    ì:"i",í:"i",î:"i",ï:"i",ò:"o",ó:"o",ô:"o",õ:"o",ö:"o",
    ù:"u",ú:"u",û:"u",ü:"u",ý:"y",đ:"d",ơ:"o",ư:"u",
    ạ:"a",ả:"a",ấ:"a",ầ:"a",ẩ:"a",ẫ:"a",ậ:"a",ắ:"a",ặ:"a",ằ:"a",ẳ:"a",ẵ:"a",
    ẹ:"e",ẻ:"e",ẽ:"e",ế:"e",ề:"e",ể:"e",ễ:"e",ệ:"e",
    ị:"i",ỉ:"i",ĩ:"i",
    ọ:"o",ỏ:"o",ố:"o",ồ:"o",ổ:"o",ỗ:"o",ộ:"o",ớ:"o",ờ:"o",ở:"o",ỡ:"o",ợ:"o",
    ụ:"u",ủ:"u",ứ:"u",ừ:"u",ử:"u",ữ:"u",ự:"u",
    ỳ:"y",ỷ:"y",ỹ:"y",ỵ:"y",
  };
  return str.toLowerCase().split("").map((c) => map[c] || c).join("")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

// ── Sub-components (giữ nguyên UI) ───────────────────────────────────────────
function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category];
  return (
    <span className={`${styles.catBadge} ${styles[`catBadge__${meta?.mod}`]}`}>
      {meta?.label ?? category}
    </span>
  );
}

function StatusDot({ status }) {
  return (
    <span
      className={`${styles.statusDot} ${
        status === "PUBLISHED" ? styles.statusDot__pub : styles.statusDot__draft
      }`}
      title={status === "PUBLISHED" ? "Đã đăng" : "Nháp"}
    />
  );
}

function ArticleCard({ article, onEdit, onDelete }) {
  return (
    <article className={styles.card}>
      <div className={styles.card__imgWrap}>
        {article.thumbnail ? (
          <img src={article.thumbnail} alt={article.title} loading="lazy" />
        ) : (
          <div className={styles.card__imgPlaceholder}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <CategoryBadge category={article.category} />
        <StatusDot status={article.status} />
      </div>
      <div className={styles.card__body}>
        <p className={styles.card__date}>{formatDate(article.createdAt)}</p>
        <h3 className={styles.card__title}>{article.title}</h3>
        {article.summary && <p className={styles.card__summary}>{article.summary}</p>}
        <div className={styles.card__footer}>
          <span className={styles.card__slug}>/{article.slug}</span>
          <div className={styles.card__actions}>
            <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); onEdit(article); }} title="Chỉnh sửa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button className={`${styles.iconBtn} ${styles.iconBtn__danger}`} onClick={(e) => { e.stopPropagation(); onDelete(article); }} title="Xoá">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ArticleRow({ article, onEdit, onDelete }) {
  const meta = CATEGORY_META[article.category];
  return (
    <div className={styles.listRow}>
      <div className={styles.listRow__thumb}>
        {article.thumbnail ? (
          <img src={article.thumbnail} alt={article.title} loading="lazy" />
        ) : (
          <div className={styles.listRow__thumbPh}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>
      <div className={styles.listRow__main}>
        <p className={styles.listRow__title}>{article.title}</p>
        <div className={styles.listRow__meta}>
          <span className={`${styles.catTag} ${styles[`catTag__${meta?.mod}`]}`}>{meta?.label}</span>
          <span className={styles.listRow__date}>{formatDate(article.createdAt)}</span>
        </div>
      </div>
      <div className={styles.listRow__right}>
        <span className={`${styles.statusPill} ${article.status === "PUBLISHED" ? styles.statusPill__pub : styles.statusPill__draft}`}>
          <span className={styles.statusPill__dot} />
          {article.status === "PUBLISHED" ? "Đã đăng" : "Nháp"}
        </span>
        <button className={styles.iconBtn} onClick={() => onEdit(article)} title="Chỉnh sửa">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className={`${styles.iconBtn} ${styles.iconBtn__danger}`} onClick={() => onDelete(article)} title="Xoá">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function FormModal({ initial, onClose, onSave, loading }) {
  const isEdit = !!initial?.idNews;
  const [form, setForm] = useState(initial ? { ...initial } : { ...EMPTY_FORM });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleTitleChange = (val) => {
    setForm((f) => ({ ...f, title: val, slug: isEdit ? f.slug : slugify(val) }));
  };

  const handleSubmit = (publish) => {
    if (!form.title.trim()) { alert("Vui lòng nhập tiêu đề."); return; }
    if (!form.content.trim()) { alert("Vui lòng nhập nội dung."); return; }
    onSave({ ...form, status: publish ? "PUBLISHED" : form.status });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modalHeading">
        <div className={styles.modal__head}>
          <div>
            <h2 id="modalHeading" className={styles.modal__title}>
              {isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
            </h2>
            <p className={styles.modal__sub}>
              {isEdit ? "Cập nhật nội dung & trạng thái" : "Điền thông tin & xuất bản"}
            </p>
          </div>
          <button className={styles.modal__closeBtn} onClick={onClose} aria-label="Đóng">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.modal__body}>
          <div className={styles.modal__main}>
            <div className={styles.field}>
              <label htmlFor="fTitle">Tiêu đề <span className={styles.field__req}>*</span></label>
              <input id="fTitle" type="text" placeholder="Nhập tiêu đề bài viết..." value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label htmlFor="fSlug">Slug (URL)</label>
              <div className={styles.slugRow}>
                <span className={styles.slugRow__prefix}>/tin-tuc/</span>
                <input id="fSlug" type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="tu-dong-tao-tu-tieu-de" />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="fSummary">
                Mô tả ngắn
                <span className={styles.field__count}>{form.summary.length}/255</span>
              </label>
              <textarea id="fSummary" rows={2} placeholder="Tóm tắt hiển thị ở danh sách bài viết..." value={form.summary} onChange={(e) => set("summary", e.target.value.slice(0, 255))} />
            </div>
            <div className={styles.field}>
              <label htmlFor="fContent">Nội dung <span className={styles.field__req}>*</span></label>
              <textarea id="fContent" rows={9} placeholder="Nội dung chính của bài viết..." value={form.content} onChange={(e) => set("content", e.target.value)} />
            </div>
          </div>

          <div className={styles.modal__sidebar}>
            <div className={styles.sideCard}>
              <p className={styles.sideCard__title}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                Phân loại
              </p>
              <div className={styles.field}>
                <label htmlFor="fCategory">Danh mục</label>
                <select id="fCategory" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {Object.entries(CATEGORY_META).map(([val, meta]) => (
                    <option key={val} value={val}>{meta.label}</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.field} ${styles.field__last}`}>
                <label htmlFor="fStatus">Trạng thái</label>
                <select id="fStatus" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="DRAFT">Nháp</option>
                  <option value="PUBLISHED">Đã đăng</option>
                </select>
              </div>
            </div>

            <div className={styles.sideCard}>
              <p className={styles.sideCard__title}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                Thumbnail
              </p>
              <div className={`${styles.field} ${styles.field__last}`}>
                <label htmlFor="fThumbnail">URL ảnh</label>
                <input id="fThumbnail" type="text" placeholder="https://..." value={form.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} />
              </div>
              {form.thumbnail && (
                <div className={styles.thumbPreview}>
                  <img src={form.thumbnail} alt="Xem trước thumbnail" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modal__foot}>
          <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Huỷ</button>
          <div className={styles.modal__footRight}>
            <button className={styles.btnGhost} onClick={() => handleSubmit(false)} disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu nháp"}
            </button>
            <button className={styles.btnGold} onClick={() => handleSubmit(true)} disabled={loading}>
              {loading ? "Đang xử lý..." : isEdit ? "Cập nhật & Đăng" : "Xuất bản"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ article, onClose, onConfirm, loading }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.delBox} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <h3 className={styles.delBox__title}>Xoá bài viết này?</h3>
        <p className={styles.delBox__body}>
          <strong>"{article.title}"</strong><br />
          Hành động này không thể hoàn tác.
        </p>
        <div className={styles.delBox__actions}>
          <button className={styles.btnGhost} onClick={onClose} disabled={loading}>Giữ lại</button>
          <button className={styles.btnDanger} onClick={onConfirm} disabled={loading}>
            {loading ? "Đang xoá..." : "Xoá"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QuanLyTinTuc() {
  const { accessToken } = useAuth();

  const [news, setNews]           = useState([]);
  const [filterCat, setFilterCat] = useState("ALL");
  const [searchQ, setSearchQ]     = useState("");
  const [viewMode, setViewMode]   = useState("grid");
  const [showForm, setShowForm]   = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // loading riêng cho từng action
  const [loadingList, setLoadingList]     = useState(false);
  const [loadingSave, setLoadingSave]     = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // ── Fetch danh sách ──
  const loadNews = useCallback(async () => {
    setLoadingList(true);
    try {
      const filters = {};
      if (filterCat !== "ALL") filters.category = filterCat;
      const data = await NewsAPI.getAllNews(filters);
      setNews(data);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
      alert("Không thể tải danh sách bài viết.");
    } finally {
      setLoadingList(false);
    }
  }, [filterCat]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // ── Derived ──
  const filtered = news.filter(
    (n) =>
      !searchQ ||
      n.title.toLowerCase().includes(searchQ.toLowerCase()) ||
      n.slug.includes(searchQ.toLowerCase())
  );

  const pubCount   = news.filter((n) => n.status === "PUBLISHED").length;
  const draftCount = news.filter((n) => n.status === "DRAFT").length;

  // ── Handlers ──
  const openCreate = () => { setEditItem(null); setShowForm(true); };
  const openEdit   = (item) => { setEditItem(item); setShowForm(true); };
  const closeForm  = () => { setShowForm(false); setEditItem(null); };

  const handleSave = async (form) => {
    setLoadingSave(true);
    try {
      if (form.idNews) {
        await NewsAPI.updateNews(form.idNews, form);
      } else {
        await NewsAPI.createNews(form);
      }
      closeForm();
      await loadNews(); // reload từ server
    } catch (err) {
      const msg = err?.message || "Lưu bài viết thất bại.";
      alert(msg);
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setLoadingDelete(true);
    try {
      await NewsAPI.deleteNews(deleteItem.idNews);
      setDeleteItem(null);
      await loadNews(); // reload từ server
    } catch (err) {
      alert("Xoá bài viết thất bại.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <header className={styles.topbar}>
        <div className={styles.topbar__brand}>
          <div className={styles.topbar__mark}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3a3 3 0 0 1 3 3c0 1.5-1 3-3 5.5S3 16 3 18a3 3 0 0 0 6 0" />
              <path d="M18 3a3 3 0 0 0-3 3c0 1.5 1 3 3 5.5s3 4.5 3 6.5a3 3 0 0 1-6 0" />
              <path d="M9 18a3 3 0 0 0 6 0" />
            </svg>
          </div>
          <span className={styles.topbar__name}>Noule</span>
          <span className={styles.topbar__sep}>—</span>
          <span className={styles.topbar__section}>Admin</span>
        </div>
        <span className={styles.topbar__breadcrumb}>Tin tức &amp; Bài viết</span>
      </header>

      <div className={styles.content}>
        {/* Page heading */}
        <div className={styles.pageHead}>
          <div>
            <p className={styles.pageHead__eyebrow}>Nội dung &amp; Truyền thông</p>
            <h1 className={styles.pageHead__title}>Tin tức &amp; <em>Phong Cách</em></h1>
          </div>
          <button className={styles.btnNew} onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Bài viết mới
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsStrip}>
          <div className={styles.statItem}>
            <div className={styles.statItem__icon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
              </svg>
            </div>
            <div>
              <p className={styles.statItem__num}>{news.length}</p>
              <p className={styles.statItem__label}>Tổng bài viết</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statItem__icon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <p className={styles.statItem__num}>{pubCount}</p>
              <p className={styles.statItem__label}>Đã xuất bản</p>
            </div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statItem__icon}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div>
              <p className={styles.statItem__num}>{draftCount}</p>
              <p className={styles.statItem__label}>Bản nháp</p>
            </div>
          </div>
        </div>

        {/* Filter + search + view toggle */}
        <div className={styles.filterRow}>
          <div className={styles.filterRow__pills}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`${styles.pill} ${filterCat === tab.value ? styles.pill__active : ""}`}
                onClick={() => setFilterCat(tab.value)}
              >
                {tab.label}
                <span className={styles.pill__count}>
                  {tab.value === "ALL"
                    ? news.length
                    : news.filter((n) => n.category === tab.value).length}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.filterRow__right}>
            <div className={styles.searchBox}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Tìm bài viết..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                aria-label="Tìm kiếm bài viết"
              />
            </div>
            <div className={styles.viewToggle} role="group" aria-label="Chế độ xem">
              <button className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtn__active : ""}`} onClick={() => setViewMode("grid")} title="Lưới">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <button className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtn__active : ""}`} onClick={() => setViewMode("list")} title="Danh sách">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* List / Grid */}
        {loadingList ? (
          <div className={styles.empty}>
            <p>Đang tải bài viết...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <p>Không có bài viết nào phù hợp.</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className={styles.gridView}>
            {filtered.map((article) => (
              <ArticleCard key={article.idNews} article={article} onEdit={openEdit} onDelete={setDeleteItem} />
            ))}
          </div>
        ) : (
          <div className={styles.listView}>
            {filtered.map((article) => (
              <ArticleRow key={article.idNews} article={article} onEdit={openEdit} onDelete={setDeleteItem} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <FormModal initial={editItem} onClose={closeForm} onSave={handleSave} loading={loadingSave} />
      )}
      {deleteItem && (
        <DeleteModal article={deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={loadingDelete} />
      )}
    </div>
  );
}