import React, { useState } from "react";
import classNames from "classnames/bind";
import { Plus, Pencil, Trash2, Eye, X, ChevronDown, FileText, Image } from "lucide-react";
import styles from "./TinTuc.module.scss";

const cx = classNames.bind(styles);

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_NEWS = [
  { idNews: 1, title: "Xu hướng tóc nam hot nhất 2025", slug: "xu-huong-toc-nam-2025", category: "STYLE", status: "PUBLISHED", createdAt: "2025-04-15T08:00:00Z" },
  { idNews: 2, title: "NOULE khai trương chi nhánh Quận 7", slug: "khai-truong-quan-7", category: "NEWS", status: "PUBLISHED", createdAt: "2025-05-01T09:00:00Z" },
  { idNews: 3, title: "Khuyến mãi tháng 5: Giảm 30%", slug: "khuyen-mai-thang-5", category: "PROMOTION", status: "DRAFT", createdAt: "2025-05-01T00:00:00Z" },
  { idNews: 4, title: "Cách chăm sóc tóc sau khi uốn", slug: "cham-soc-toc-uon", category: "STYLE", status: "DRAFT", createdAt: "2025-04-20T10:00:00Z" },
  { idNews: 5, title: "Beard Styling: Nghệ thuật tạo hình râu", slug: "beard-styling", category: "STYLE", status: "PUBLISHED", createdAt: "2025-04-10T08:00:00Z" },
];

const CATEGORY_OPTIONS = [
  { value: "NEWS",      label: "Tin tức" },
  { value: "PROMOTION", label: "Khuyến mãi" },
  { value: "STYLE",     label: "Phong cách" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT",     label: "Nháp" },
  { value: "PUBLISHED", label: "Đã đăng" },
];

const CATEGORY_LABELS = { NEWS: "Tin tức", PROMOTION: "Khuyến mãi", STYLE: "Phong cách" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY_FORM = { title: "", slug: "", summary: "", content: "", category: "NEWS", status: "DRAFT", thumbnail: "" };

function slugify(str) {
  return str.toLowerCase()
    .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u").replace(/[ýÿ]/g, "y")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return <span className={cx("badge", `badge_${status}`)}>{status === "PUBLISHED" ? "Đã đăng" : "Nháp"}</span>;
}

function CategoryBadge({ category }) {
  return <span className={cx("catBadge", `cat_${category}`)}>{CATEGORY_LABELS[category]}</span>;
}

// ── Preview Modal ─────────────────────────────────────────────────────────────
function PreviewModal({ article, onClose }) {
  if (!article) return null;
  return (
    <div className={cx("overlay")} onClick={onClose}>
      <div className={cx("previewModal")} onClick={e => e.stopPropagation()}>
        <button className={cx("closeBtn")} onClick={onClose}><X size={18} /></button>
        <div className={cx("previewInner")}>
          <div className={cx("previewMeta")}>
            <CategoryBadge category={article.category} />
            <StatusBadge status={article.status} />
          </div>
          {article.thumbnail && (
            <div className={cx("previewThumb")}>
              <img src={article.thumbnail} alt={article.title} />
            </div>
          )}
          <h2 className={cx("previewTitle")}>{article.title || "Chưa có tiêu đề"}</h2>
          {article.summary && <p className={cx("previewSummary")}>{article.summary}</p>}
          <div className={cx("previewDivider")} />
          <div className={cx("previewContent")}>{article.content || <em>Chưa có nội dung.</em>}</div>
        </div>
      </div>
    </div>
  );
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function FormModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [showPreview, setShowPreview] = useState(false);
  const isEdit = !!initial?.idNews;

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTitleChange = (val) => {
    setForm(f => ({ ...f, title: val, slug: slugify(val) }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return alert("Vui lòng nhập tiêu đề.");
    if (!form.content.trim()) return alert("Vui lòng nhập nội dung.");
    onSave(form);
  };

  return (
    <>
      <div className={cx("overlay")} onClick={onClose}>
        <div className={cx("formModal")} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className={cx("modalHeader")}>
            <div>
              <h2 className={cx("modalTitle")}>{isEdit ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}</h2>
              <p className={cx("modalSub")}>Điền thông tin bên dưới và xem trước trước khi đăng</p>
            </div>
            <button className={cx("closeBtn")} onClick={onClose}><X size={18} /></button>
          </div>

          {/* Body */}
          <div className={cx("modalBody")}>
            {/* Left col */}
            <div className={cx("formMain")}>
              <div className={cx("fieldGroup")}>
                <label className={cx("label")}>Tiêu đề <span>*</span></label>
                <input
                  className={cx("input")}
                  placeholder="Nhập tiêu đề bài viết..."
                  value={form.title}
                  onChange={e => handleTitleChange(e.target.value)}
                />
              </div>

              <div className={cx("fieldGroup")}>
                <label className={cx("label")}>Slug (URL)</label>
                <div className={cx("slugWrap")}>
                  <span className={cx("slugPrefix")}>/tin-tuc/</span>
                  <input
                    className={cx("input", "slugInput")}
                    value={form.slug}
                    onChange={e => set("slug", e.target.value)}
                  />
                </div>
              </div>

              <div className={cx("fieldGroup")}>
                <label className={cx("label")}>Mô tả ngắn</label>
                <textarea
                  className={cx("textarea", "textareaSm")}
                  placeholder="Tóm tắt bài viết, hiển thị ở trang danh sách..."
                  value={form.summary}
                  onChange={e => set("summary", e.target.value)}
                  rows={3}
                />
              </div>

              <div className={cx("fieldGroup")}>
                <label className={cx("label")}>Nội dung <span>*</span></label>
                <textarea
                  className={cx("textarea")}
                  placeholder="Nội dung chính của bài viết..."
                  value={form.content}
                  onChange={e => set("content", e.target.value)}
                  rows={10}
                />
              </div>
            </div>

            {/* Right col — sidebar */}
            <div className={cx("formSidebar")}>
              <div className={cx("sideCard")}>
                <p className={cx("sideCardTitle")}><FileText size={14} /> Phân loại</p>

                <div className={cx("fieldGroup")}>
                  <label className={cx("label")}>Danh mục</label>
                  <div className={cx("selectWrap")}>
                    <select className={cx("select")} value={form.category} onChange={e => set("category", e.target.value)}>
                      {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} className={cx("selectIcon")} />
                  </div>
                </div>

                <div className={cx("fieldGroup")}>
                  <label className={cx("label")}>Trạng thái</label>
                  <div className={cx("selectWrap")}>
                    <select className={cx("select")} value={form.status} onChange={e => set("status", e.target.value)}>
                      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <ChevronDown size={14} className={cx("selectIcon")} />
                  </div>
                </div>
              </div>

              <div className={cx("sideCard")}>
                <p className={cx("sideCardTitle")}><Image size={14} /> Ảnh thumbnail</p>
                <input
                  className={cx("input")}
                  placeholder="Dán URL ảnh vào đây..."
                  value={form.thumbnail}
                  onChange={e => set("thumbnail", e.target.value)}
                />
                {form.thumbnail && (
                  <div className={cx("thumbPreview")}>
                    <img src={form.thumbnail} alt="thumbnail preview" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={cx("modalFooter")}>
            <button className={cx("btnOutline")} onClick={() => setShowPreview(true)}>
              <Eye size={15} /> Xem trước
            </button>
            <div className={cx("footerRight")}>
              <button className={cx("btnGhost")} onClick={onClose}>Huỷ</button>
              <button className={cx("btnPrimary")} onClick={handleSubmit}>
                {form.status === "PUBLISHED" ? "Đăng bài" : "Lưu nháp"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPreview && <PreviewModal article={form} onClose={() => setShowPreview(false)} />}
    </>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function QuanLyTinTuc() {
  const [news, setNews] = useState(MOCK_NEWS);
  const [filterCat, setFilterCat] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);

  const filtered = news.filter(n =>
    (filterCat === "ALL" || n.category === filterCat) &&
    (filterStatus === "ALL" || n.status === filterStatus)
  );

  const handleSave = (form) => {
    if (form.idNews) {
      setNews(prev => prev.map(n => n.idNews === form.idNews ? { ...n, ...form } : n));
    } else {
      setNews(prev => [...prev, { ...form, idNews: Date.now(), createdAt: new Date().toISOString() }]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Xoá bài viết này?")) {
      setNews(prev => prev.filter(n => n.idNews !== id));
    }
  };

  const openEdit = (item) => { setEditItem(item); setShowForm(true); };
  const openCreate = () => { setEditItem(null); setShowForm(true); };

  return (
    <div className={cx("page")}>
      {/* ── Page header ── */}
      <div className={cx("pageHeader")}>
        <div>
          <h1 className={cx("pageTitle")}>Quản lý Tin Tức</h1>
          <p className={cx("pageSub")}>Tạo và quản lý bài viết hiển thị trên trang chủ</p>
        </div>
        <button className={cx("btnCreate")} onClick={openCreate}>
          <Plus size={16} /> Tạo bài viết
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className={cx("statsRow")}>
        <div className={cx("statCard")}>
          <span className={cx("statNum")}>{news.length}</span>
          <span className={cx("statLabel")}>Tổng bài viết</span>
        </div>
        <div className={cx("statCard")}>
          <span className={cx("statNum")}>{news.filter(n => n.status === "PUBLISHED").length}</span>
          <span className={cx("statLabel")}>Đã đăng</span>
        </div>
        <div className={cx("statCard")}>
          <span className={cx("statNum")}>{news.filter(n => n.status === "DRAFT").length}</span>
          <span className={cx("statLabel")}>Bản nháp</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={cx("filters")}>
        <div className={cx("filterGroup")}>
          {["ALL", "NEWS", "PROMOTION", "STYLE"].map(cat => (
            <button
              key={cat}
              className={cx("filterTab", { active: filterCat === cat })}
              onClick={() => setFilterCat(cat)}
            >
              {cat === "ALL" ? "Tất cả" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className={cx("filterGroup")}>
          {["ALL", "PUBLISHED", "DRAFT"].map(s => (
            <button
              key={s}
              className={cx("filterTab", "filterTabSm", { active: filterStatus === s })}
              onClick={() => setFilterStatus(s)}
            >
              {s === "ALL" ? "Mọi trạng thái" : s === "PUBLISHED" ? "Đã đăng" : "Nháp"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className={cx("tableWrap")}>
        <table className={cx("table")}>
          <thead>
            <tr>
              <th>Tiêu đề</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className={cx("emptyRow")}>Không có bài viết nào.</td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr key={item.idNews} className={cx("tableRow")}>
                  <td>
                    <div className={cx("titleCell")}>
                      <span className={cx("titleText")}>{item.title}</span>
                      <span className={cx("slugText")}>/tin-tuc/{item.slug}</span>
                    </div>
                  </td>
                  <td><CategoryBadge category={item.category} /></td>
                  <td><StatusBadge status={item.status} /></td>
                  <td className={cx("dateCell")}>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className={cx("actions")}>
                      <button className={cx("actionBtn")} title="Xem trước" onClick={() => setPreviewItem(item)}>
                        <Eye size={15} />
                      </button>
                      <button className={cx("actionBtn")} title="Chỉnh sửa" onClick={() => openEdit(item)}>
                        <Pencil size={15} />
                      </button>
                      <button className={cx("actionBtn", "actionDanger")} title="Xoá" onClick={() => handleDelete(item.idNews)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}
      {showForm && (
        <FormModal
          initial={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
      {previewItem && <PreviewModal article={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}