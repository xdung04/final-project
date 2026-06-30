import { useState, useMemo, useEffect } from "react";
import classNames from "classnames/bind";
import {
  Search, Plus, Tag, Edit, Trash2, X, Check,
  Upload, ChevronLeft, ChevronRight, LayoutGrid, List, Scissors, RotateCcw
} from "lucide-react";
import styles from "./KieuToc.module.scss";

import { hairStyleAPI } from "~/apis/hairStyleAPI";

const cx = classNames.bind(styles);

const EMPTY_FORM = {
  name: "",
  slug: "",
  idCategory: "",
  difficultyLevel: "Medium",
  maintenanceLevel: "Medium",
  suitableAge: "",
  shortDescription: "",
  status: "Active",
  coverImage: "",
  sideImage: ""
};

const DIFF_KEY = {
  "Dễ": "easy", "Trung bình": "medium", "Khó": "hard",
  "Easy": "easy", "Medium": "medium", "Hard": "hard",
  "Low": "easy", "High": "hard"
};

function toSlug(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

function ImgPlaceholder({ src, alt }) {
  if (src) return <img src={src} alt={alt} className={cx("card__imgReal")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <div className={cx("card__imgPlaceholder")}>
      <Scissors size={28} strokeWidth={1.2} />
      <span>Không có ảnh</span>
    </div>
  );
}

function ListThumbPh({ src, alt }) {
  if (src) return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />;
  return (
    <div className={cx("listRow__thumbPh")}>
      <Scissors size={18} strokeWidth={1.2} />
    </div>
  );
}

export default function KieuToc() {
  const [data, setData]                   = useState([]);
  const [cats, setCats]                   = useState([]);
  const [search, setSearch]               = useState("");
  const [catFilter, setCatFilter]         = useState("all");
  const [statusFilter, setStatusFilter]   = useState("");
  const [diffFilter, setDiffFilter]       = useState("");
  const [view, setView]                   = useState("grid");
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(false);
  const PER = 8;

  const [coverImageFile, setCoverImageFile] = useState(null);
  const [sideImageFile, setSideImageFile]   = useState(null);
  const [modal, setModal]                   = useState(null);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [editId, setEditId]                 = useState(null);
  const [deleteId, setDeleteId]             = useState(null);
  const [newCatName, setNewCatName]         = useState("");

  // ── Load data ──
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, hairstylesRes] = await Promise.all([
        hairStyleAPI.getAdminCategories(),
        hairStyleAPI.getAdminHairstyles()
      ]);
      const categoriesData = categoriesRes?.data?.data || categoriesRes?.data || categoriesRes;
      const hairstylesData = hairstylesRes?.data?.data || hairstylesRes?.data || hairstylesRes;
      if (Array.isArray(categoriesData)) setCats(categoriesData);
      if (Array.isArray(hairstylesData)) setData(hairstylesData);
    } catch (error) {
      console.error("❌ Lỗi load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, []);

  // ── Derived state ──
  const catCounts = useMemo(() => {
    const c = { all: data.length };
    cats.forEach((cat) => {
      c[cat.idCategory] = data.filter((r) => String(r.idCategory) === String(cat.idCategory)).length;
    });
    return c;
  }, [data, cats]);

  const filtered = useMemo(() => data.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.name.toLowerCase().includes(q) || (r.slug && r.slug.includes(q))) &&
      (catFilter === "all" || String(r.idCategory) === String(catFilter)) &&
      (!statusFilter || r.status === statusFilter) &&
      (!diffFilter   || r.difficultyLevel === diffFilter)
    );
  }), [data, search, catFilter, statusFilter, diffFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageRows   = filtered.slice((page - 1) * PER, page * PER);
  const resetPage  = () => setPage(1);
  const totalActive = data.filter((r) => r.status === "Active").length;

  // ── Helpers ──
  const getDeleteTarget = () => data.find((r) => r.idHairstyle === deleteId);
  const isInactive = (idHairstyle) => data.find((r) => r.idHairstyle === idHairstyle)?.status === "Inactive";

  // ── Modal handlers ──
  function openAdd() { setForm(EMPTY_FORM); setEditId(null); setModal("add"); }

  function openEdit(idHairstyle) {
    const r = data.find((x) => x.idHairstyle === idHairstyle);
    if (!r) return;
    setForm({
      name: r.name || "",
      slug: r.slug || "",
      idCategory: r.idCategory || "",
      difficultyLevel: r.difficultyLevel || "Medium",
      maintenanceLevel: r.maintenanceLevel || "Medium",
      suitableAge: r.suitableAge || "",
      shortDescription: r.shortDescription || "",
      status: r.status || "Active",
      coverImage: r.coverImage || "",
      sideImage: r.sideImage || ""
    });
    setEditId(idHairstyle);
    setModal("edit");
  }

  function openDelete(idHairstyle) { setDeleteId(idHairstyle); setModal("delete"); }

  function closeModal() {
    setModal(null);
    setDeleteId(null);
    setEditId(null);
    setCoverImageFile(null);
    setSideImageFile(null);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((p) => {
      const n = { ...p, [name]: value };
      if (name === "name") n.slug = toSlug(value);
      return n;
    });
  }

  const handleImageChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    if (field === "coverImage") setCoverImageFile(file);
    if (field === "sideImage")  setSideImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, [field]: previewUrl }));
  };

  // ── CRUD handlers ──
  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) { alert("Vui lòng nhập Tên và Slug!"); return; }
    try {
      const formData = new FormData();
      formData.append("name",             form.name);
      formData.append("slug",             form.slug);
      formData.append("idCategory",       form.idCategory);
      formData.append("difficultyLevel",  form.difficultyLevel);
      formData.append("maintenanceLevel", form.maintenanceLevel);
      formData.append("suitableAge",      form.suitableAge);
      formData.append("shortDescription", form.shortDescription);
      formData.append("status",           form.status);
      if (coverImageFile) formData.append("coverImage", coverImageFile);
      if (sideImageFile)  formData.append("sideImage",  sideImageFile);

      if (editId) {
        await hairStyleAPI.updateAdminHairstyle(editId, formData);
      } else {
        await hairStyleAPI.createAdminHairstyle(formData);
      }
      await loadInitialData();
      closeModal();
    } catch (error) {
      alert("Lỗi lưu kiểu tóc!");
    }
  }

  // Soft delete — chuyển sang Inactive
  async function handleDelete() {
    try {
      await hairStyleAPI.deleteAdminHairstyle(deleteId);
      await loadInitialData();
      setPage(1);
      closeModal();
    } catch (error) {
      alert("Không thể ẩn kiểu tóc!");
    }
  }

  // Khôi phục — chuyển lại Active
  async function handleRestore() {
    try {
      const formData = new FormData();
      formData.append("status", "Active");
      await hairStyleAPI.updateAdminHairstyle(deleteId, formData);
      await loadInitialData();
      setPage(1);
      closeModal();
    } catch (error) {
      alert("Không thể khôi phục kiểu tóc!");
    }
  }

  async function handleAddCat() {
    const n = newCatName.trim();
    if (!n) return;
    try {
      await hairStyleAPI.createAdminCategory({ name: n, slug: toSlug(n) });
      setNewCatName("");
      await loadInitialData();
    } catch (error) {
      alert("Lỗi thêm danh mục!");
    }
  }

  async function handleDeleteCat(idCategory) {
    if (!window.confirm("Xóa danh mục này có thể ảnh hưởng đến các kiểu tóc trực thuộc?")) return;
    try {
      await hairStyleAPI.deleteAdminCategory(idCategory);
      await loadInitialData();
    } catch (error) {
      alert("Lỗi không thể xóa danh mục!");
    }
  }

  const deleteTarget = getDeleteTarget();
  const deleteName = deleteTarget?.name || "";
  const deleteIsInactive = deleteTarget?.status === "Inactive";

  return (
    <div className={cx("page")}>
      {/* Topbar */}
      <header className={cx("topbar")}>
        <div className={cx("topbar__brand")}>
          <div className={cx("topbar__mark")}><Scissors size={15} /></div>
          <span className={cx("topbar__name")}>Noule Barber</span>
          <span className={cx("topbar__sep")}>›</span>
          <span className={cx("topbar__section")}>Admin</span>
        </div>
        <span className={cx("topbar__breadcrumb")}>Nội dung &amp; Dữ liệu</span>
      </header>

      <div className={cx("content")}>
        {/* Page heading */}
        <div className={cx("pageHead")}>
          <div>
            <div className={cx("pageHead__eyebrow")}>Nội dung &amp; Dữ liệu</div>
            <h1 className={cx("pageHead__title")}>Kiểu Tóc &amp; <em>Danh Mục</em></h1>
          </div>
          <div className={cx("pageHead__actions")}>
            <button className={cx("btnGhost")} onClick={() => setModal("category")}>
              <Tag size={13} /> Danh Mục
            </button>
            <button className={cx("btnGold")} onClick={openAdd}>
              <Plus size={14} /> Thêm Kiểu Tóc
            </button>
          </div>
        </div>

        {loading && <div style={{ color: "var(--gold)", textAlign: "center", padding: "10px" }}>Đang tải dữ liệu...</div>}

        {/* Stats */}
        <div className={cx("statsStrip")}>
          {[
            { icon: <Scissors size={18} />, num: data.length,                label: "Tổng kiểu tóc" },
            { icon: <Check size={18} />,    num: totalActive,                 label: "Đang hiển thị" },
            { icon: <Tag size={18} />,      num: cats.length,                 label: "Danh mục" },
            { icon: <X size={18} />,        num: data.length - totalActive,   label: "Tạm ẩn" },
          ].map((s, i) => (
            <div className={cx("statItem")} key={i}>
              <div className={cx("statItem__icon")}>{s.icon}</div>
              <div>
                <div className={cx("statItem__num")}>{s.num}</div>
                <div className={cx("statItem__label")}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Category pills */}
        <div className={cx("filterRow")}>
          <div className={cx("filterRow__pills")}>
            <button
              className={cx("pill", { "pill__active": catFilter === "all" })}
              onClick={() => { setCatFilter("all"); resetPage(); }}
            >
              Tất cả <span className={cx("pillCount")}>{catCounts["all"] ?? 0}</span>
            </button>
            {cats.map((c) => (
              <button
                key={c.idCategory}
                className={cx("pill", { "pill__active": String(catFilter) === String(c.idCategory) })}
                onClick={() => { setCatFilter(c.idCategory); resetPage(); }}
              >
                {c.name}
                <span className={cx("pillCount")}>{catCounts[c.idCategory] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className={cx("filterRow__right")}>
            <div className={cx("searchBox")}>
              <Search size={14} />
              <input
                placeholder="Tìm kiểu tóc..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              />
            </div>
            <div className={cx("viewToggle")}>
              <button className={cx("viewBtn", { "viewBtn__active": view === "grid" })} onClick={() => setView("grid")}>
                <LayoutGrid size={14} />
              </button>
              <button className={cx("viewBtn", { "viewBtn__active": view === "list" })} onClick={() => setView("list")}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub filters */}
        <div className={cx("filterBar")}>
          <select className={cx("filterSelect")} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}>
            <option value="">Trạng thái</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select className={cx("filterSelect")} value={diffFilter} onChange={(e) => { setDiffFilter(e.target.value); resetPage(); }}>
            <option value="">Độ khó</option>
            <option value="Easy">Dễ (Easy)</option>
            <option value="Medium">Trung bình (Medium)</option>
            <option value="Hard">Khó (Hard)</option>
          </select>
          {(search || statusFilter || diffFilter || catFilter !== "all") && (
            <button
              className={cx("btnGhost")}
              style={{ padding: "5px 12px", fontSize: 11 }}
              onClick={() => { setSearch(""); setCatFilter("all"); setStatusFilter(""); setDiffFilter(""); resetPage(); }}
            >
              <X size={11} /> Xóa lọc
            </button>
          )}
          <span className={cx("filterCount")}>{filtered.length} kiểu tóc</span>
        </div>

        {/* ── GRID view ── */}
        {view === "grid" && (
          <div className={cx("gridView")}>
            {pageRows.length === 0 ? (
              <div className={cx("empty")}>
                <Scissors size={32} strokeWidth={1} />
                <p>Không tìm thấy dữ liệu phù hợp bộ lọc</p>
              </div>
            ) : pageRows.map((r) => {
              const dk = DIFF_KEY[r.difficultyLevel] || "medium";
              const currentCategoryName = cats.find(c => String(c.idCategory) === String(r.idCategory))?.name || "—";
              const inactive = r.status === "Inactive";
              return (
                <div className={cx("card", { "card__inactive": inactive })} key={r.idHairstyle}>
                  <div className={cx("card__imgWrap")}>
                    <ImgPlaceholder src={r.coverImage} alt={r.name} />
                    <span className={cx("catBadge")}>{currentCategoryName}</span>
                    <span className={cx("statusDot", inactive ? "statusDot__inactive" : "statusDot__active")} />
                    {r.difficultyLevel && (
                      <span className={cx("diffBadge", `diffBadge__${dk}`)}>{r.difficultyLevel}</span>
                    )}
                    {inactive && (
                      <span className={cx("inactiveBanner")}>Đã ẩn</span>
                    )}
                  </div>
                  <div className={cx("card__body")}>
                    <div className={cx("card__title")}>{r.name}</div>
                    {r.shortDescription && <div className={cx("card__desc")}>{r.shortDescription}</div>}
                    <div className={cx("card__meta")}>
                      {r.maintenanceLevel && <span className={cx("metaChip")}>Bảo dưỡng: {r.maintenanceLevel}</span>}
                      {r.suitableAge      && <span className={cx("metaChip")}>{r.suitableAge}</span>}
                    </div>
                    <div className={cx("card__footer")}>
                      <span className={cx("card__slug")}>{r.slug}</span>
                      <div className={cx("card__actions")}>
                        <button className={cx("iconBtn")} title="Chỉnh sửa" onClick={() => openEdit(r.idHairstyle)}>
                          <Edit size={13} />
                        </button>
                        {inactive ? (
                          <button
                            className={cx("iconBtn", "iconBtn__restore")}
                            title="Khôi phục"
                            onClick={() => openDelete(r.idHairstyle)}
                          >
                            <RotateCcw size={13} />
                          </button>
                        ) : (
                          <button
                            className={cx("iconBtn", "iconBtn__danger")}
                            title="Ẩn kiểu tóc"
                            onClick={() => openDelete(r.idHairstyle)}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIST view ── */}
        {view === "list" && (
          <div className={cx("listView")}>
            {pageRows.length === 0 ? (
              <div className={cx("empty")}>
                <Scissors size={32} strokeWidth={1} />
                <p>Không có dữ liệu</p>
              </div>
            ) : pageRows.map((r) => {
              const dk = DIFF_KEY[r.difficultyLevel] || "medium";
              const currentCategoryName = cats.find(c => String(c.idCategory) === String(r.idCategory))?.name || "—";
              const inactive = r.status === "Inactive";
              return (
                <div className={cx("listRow", { "listRow__inactive": inactive })} key={r.idHairstyle}>
                  <div className={cx("listRow__thumb")}><ListThumbPh src={r.coverImage} alt={r.name} /></div>
                  <div className={cx("listRow__main")}>
                    <div className={cx("listRow__title")}>{r.name}</div>
                    <div className={cx("listRow__meta")}>
                      <span className={cx("catTag")}>{currentCategoryName}</span>
                      {r.difficultyLevel && <span className={cx("diffTag", `diffTag__${dk}`)}>{r.difficultyLevel}</span>}
                      <span className={cx("listRow__slug")}>{r.slug}</span>
                    </div>
                  </div>
                  <div className={cx("listRow__right")}>
                    {r.suitableAge && <span className={cx("metaChip")}>{r.suitableAge}</span>}
                    <span className={cx("statusPill", inactive ? "statusPill__inactive" : "statusPill__active")}>
                      <span className={cx("statusPill__dot")} />
                      {r.status}
                    </span>
                    <button className={cx("iconBtn")} onClick={() => openEdit(r.idHairstyle)}><Edit size={13} /></button>
                    {inactive ? (
                      <button
                        className={cx("iconBtn", "iconBtn__restore")}
                        title="Khôi phục"
                        onClick={() => openDelete(r.idHairstyle)}
                      >
                        <RotateCcw size={13} />
                      </button>
                    ) : (
                      <button
                        className={cx("iconBtn", "iconBtn__danger")}
                        title="Ẩn kiểu tóc"
                        onClick={() => openDelete(r.idHairstyle)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={cx("pagination")}>
            <span className={cx("pagInfo")}>Trang {page} / {totalPages}</span>
            <div className={cx("pagBtns")}>
              <button className={cx("pagBtn")} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className={cx("pagBtn", { pagBtnActive: p === page })} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button className={cx("pagBtn")} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: ADD / EDIT ── */}
      {(modal === "add" || modal === "edit") && (
        <div className={cx("overlay")} onClick={closeModal}>
          <div className={cx("modal")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("modal__head")}>
              <div>
                <div className={cx("modal__title")}>
                  {modal === "add" ? "Thêm Kiểu Tóc Mới" : "Chỉnh Sửa Kiểu Tóc"}
                </div>
                <div className={cx("modal__sub")}>
                  {modal === "add" ? "Tạo kiểu tóc mới vào hệ thống" : `Đang chỉnh sửa: ${form.name}`}
                </div>
              </div>
              <button className={cx("modal__closeBtn")} onClick={closeModal}><X size={15} /></button>
            </div>

            <div className={cx("modal__body")}>
              <div>
                <div className={cx("field")}>
                  <label>Tên Kiểu Tóc <span className={cx("fieldReq")}>*</span></label>
                  <input name="name" placeholder="vd: Undercut Classic" value={form.name} onChange={handleFormChange} />
                </div>
                <div className={cx("field")}>
                  <label>Slug <span className={cx("fieldReq")}>*</span></label>
                  <div className={cx("slugRow")}>
                    <span className={cx("slugRow__prefix")}>noule.vn/</span>
                    <input name="slug" value={form.slug} onChange={handleFormChange} />
                  </div>
                </div>
                <div className={cx("fieldGrid")}>
                  <div className={cx("field")}>
                    <label>Danh Mục</label>
                    <select name="idCategory" value={form.idCategory} onChange={handleFormChange}>
                      <option value="">-- Chọn --</option>
                      {cats.map((c) => <option key={c.idCategory} value={c.idCategory}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={cx("field")}>
                    <label>Trạng Thái</label>
                    <select name="status" value={form.status} onChange={handleFormChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className={cx("field")}>
                    <label>Độ Khó</label>
                    <select name="difficultyLevel" value={form.difficultyLevel} onChange={handleFormChange}>
                      <option value="Easy">Dễ</option>
                      <option value="Medium">Trung bình</option>
                      <option value="Hard">Khó</option>
                    </select>
                  </div>
                  <div className={cx("field")}>
                    <label>Bảo Dưỡng</label>
                    <select name="maintenanceLevel" value={form.maintenanceLevel} onChange={handleFormChange}>
                      <option value="Low">Thấp (Low)</option>
                      <option value="Medium">Trung bình (Medium)</option>
                      <option value="High">Cao (High)</option>
                    </select>
                  </div>
                </div>
                <div className={cx("field")}>
                  <label>Độ Tuổi Phù Hợp</label>
                  <input name="suitableAge" placeholder="vd: 18-35 tuổi" value={form.suitableAge} onChange={handleFormChange} />
                </div>
                <div className={cx("field")}>
                  <label>Mô Tả Ngắn</label>
                  <textarea name="shortDescription" placeholder="Mô tả..." value={form.shortDescription} onChange={handleFormChange} />
                </div>
              </div>

              {/* Sidebar ảnh */}
              <div>
                <div className={cx("sideCard")}>
                  <div className={cx("sideCard__title")}><Upload size={11} /> Ảnh Cover (Chính diện)</div>
                  <div className={cx("uploadZone")} onClick={() => document.getElementById("fCoverImg").click()}>
                    {form.coverImage ? (
                      <img src={form.coverImage} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "100px" }} />
                    ) : (
                      <><Upload size={20} /><span>Nhấn để tải ảnh</span></>
                    )}
                    <input id="fCoverImg" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageChange(e, "coverImage")} />
                  </div>
                </div>
                <div className={cx("sideCard")}>
                  <div className={cx("sideCard__title")}><Upload size={11} /> Ảnh Cạnh (Góc nghiêng / Side)</div>
                  <div className={cx("uploadZone")} onClick={() => document.getElementById("fSideImg").click()}>
                    {form.sideImage ? (
                      <img src={form.sideImage} alt="Side Preview" style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: "100px" }} />
                    ) : (
                      <><Upload size={20} /><span>Nhấn để tải ảnh</span></>
                    )}
                    <input id="fSideImg" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageChange(e, "sideImage")} />
                  </div>
                </div>
              </div>
            </div>

            <div className={cx("modal__foot")}>
              <button className={cx("btnGhost")} onClick={closeModal}>Hủy</button>
              <button className={cx("btnGold")} onClick={handleSave}>
                <Check size={14} /> Lưu Kiểu Tóc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE / RESTORE ── */}
      {modal === "delete" && (
        <div className={cx("overlay")} onClick={closeModal}>
          <div className={cx("delBox")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("delBox__icon", { "delBox__icon--restore": deleteIsInactive })}>
              {deleteIsInactive ? <RotateCcw size={22} /> : <Trash2 size={22} />}
            </div>
            <div className={cx("delBox__title")}>
              {deleteIsInactive ? "Khôi Phục Kiểu Tóc" : "Xác Nhận Ẩn"}
            </div>
            <p className={cx("delBox__body")}>
              {deleteIsInactive
                ? <>Kiểu tóc <strong>"{deleteName}"</strong> đang bị ẩn. Bạn muốn khôi phục và hiển thị lại không?</>
                : <>Bạn chắc chắn muốn ẩn kiểu tóc <strong>"{deleteName}"</strong>? Có thể khôi phục sau.</>
              }
            </p>
            <div className={cx("delBox__actions")}>
              <button className={cx("btnGhost")} onClick={closeModal}>Hủy</button>
              {deleteIsInactive ? (
                <button className={cx("btnGold")} onClick={handleRestore}>
                  <RotateCcw size={13} /> Khôi Phục
                </button>
              ) : (
                <button className={cx("btnDanger")} onClick={handleDelete}>
                  <Trash2 size={13} /> Ẩn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CATEGORY ── */}
      {modal === "category" && (
        <div className={cx("overlay")} onClick={closeModal}>
          <div className={cx("modal", "modalSm")} onClick={(e) => e.stopPropagation()}>
            <div className={cx("modal__head")}>
              <div>
                <div className={cx("modal__title")}>Quản Lý Danh Mục</div>
                <div className={cx("modal__sub")}>{cats.length} danh mục hiện có</div>
              </div>
              <button className={cx("modal__closeBtn")} onClick={closeModal}><X size={15} /></button>
            </div>
            <div className={cx("catModalBody")}>
              <div className={cx("catAddRow")}>
                <input
                  className={cx("catInput")}
                  placeholder="Tên danh mục mới..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCat()}
                />
                <button className={cx("btnGold")} onClick={handleAddCat}>
                  <Plus size={14} /> Thêm
                </button>
              </div>
              {cats.map((c) => {
                const count = data.filter((r) => String(r.idCategory) === String(c.idCategory)).length;
                return (
                  <div className={cx("catItem")} key={c.idCategory}>
                    <div className={cx("catItem__left")}>
                      <Tag size={13} style={{ color: "var(--gold, #C9A84C)" }} /> {c.name}
                    </div>
                    <div className={cx("catItem__right")}>
                      <span className={cx("catCount")}>{count} kiểu</span>
                      <button
                        className={cx("iconBtn", "iconBtn__danger")}
                        onClick={() => handleDeleteCat(c.idCategory)}
                        title="Xóa danh mục"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={cx("modal__foot")}>
              <button className={cx("btnGold")} onClick={closeModal}>
                <Check size={14} /> Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}