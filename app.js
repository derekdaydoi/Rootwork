/* Rootwork — OKR, lịch tuần và thói quen.
   Cây Objective → Key Result → Task là bản sắc, giữ nguyên.
   Tương tác ở tầng task mượn quy ước Reminders: ngày/giờ tách rời,
   nhập liền dòng, chạm mở chi tiết, vuốt để hoãn/xoá, xoá mềm 30 ngày. */

const { useState, useEffect, useRef, useCallback } = React;
const h = React.createElement;
const Fragment = React.Fragment;

const STORAGE_KEY = "rootwork:v1";
const SCHEMA_VERSION = 3;
const TRASH_DAYS = 30;
const DOW = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/* ===================== icon set =====================
   Dùng SVG stroke theo currentColor thay cho emoji. Emoji trên iOS
   render thành ảnh màu, phá bảng màu và không đổi màu theo trạng thái. */
const PATHS = {
  calendar: ["M8 3v3", "M16 3v3", "M3.5 9.5h17", "M6.5 5.5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3z"],
  clock: ["M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z", "M12 7.5v5l3.5 2"],
  flag: ["M6 21V4.5", "M6 5.2h10.5l-2 3.4 2 3.4H6"],
  target: ["M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z", "M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z"],
  trash: ["M4.5 6.5h15", "M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5", "M6.5 6.5l1 12a2 2 0 0 0 2 1.9h5a2 2 0 0 0 2-1.9l1-12"],
  archive: ["M3.5 4.5h17v4h-17z", "M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-10", "M10 12.5h4"],
  restore: ["M4 11a8 8 0 1 1 2.5 5.8", "M3.5 5.5v5.5h5.5"],
  chevron: ["M9 5.5l6.5 6.5L9 18.5"],
  back: ["M14.5 5.5L8 12l6.5 6.5"],
  arrow: ["M5 12h13", "M12.5 6.5L18 12l-5.5 5.5"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
  close: ["M6.5 6.5l11 11", "M17.5 6.5l-11 11"],
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  undo: ["M9.5 6.5L4 12l5.5 5.5", "M4 12h11a5 5 0 0 1 0 10h-2"],
  download: ["M12 4v11", "M7.5 10.5L12 15l4.5-4.5", "M4.5 19.5h15"],
  upload: ["M12 15V4", "M7.5 8.5L12 4l4.5 4.5", "M4.5 19.5h15"],
  grid: ["M4 4.5h6.5v6.5H4z", "M13.5 4.5H20v6.5h-6.5z", "M4 13.5h6.5V20H4z", "M13.5 13.5H20V20h-6.5z"],
  repeat: ["M4 9.5A4.5 4.5 0 0 1 8.5 5h11", "M16 1.5L19.5 5 16 8.5", "M20 14.5a4.5 4.5 0 0 1-4.5 4.5h-11", "M8 22.5L4.5 19 8 15.5"],
  plus: ["M12 5v14", "M5 12h14"],
  home: ["M3.5 10.5L12 3.8l8.5 6.7", "M5.5 9.5v10h13v-10", "M9.5 19.5v-6h5v6"]
};
function Icon({ name, size, width, className, style }) {
  const d = PATHS[name] || [];
  return h("svg", {
    width: size || 20, height: size || 20, viewBox: "0 0 24 24", fill: "none", className, style,
    stroke: "currentColor", strokeWidth: width || 1.7, strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": "true", focusable: "false"
  }, d.map((p, i) => h("path", { key: i, d: p })));
}

/* ===================== helpers ===================== */
function deepClone(v) {
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}
function uid() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
function iso(value) {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
function isIsoDate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + "T00:00:00").getTime());
}
function isTime(v) { return typeof v === "string" && /^\d{2}:\d{2}$/.test(v); }
function startOfWeek(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function addDays(value, n) { const d = new Date(value); d.setDate(d.getDate() + n); return d; }
function formatRange(monday) {
  return monday.toLocaleDateString("vi-VN", { day: "numeric", month: "short" }) + " – " +
    addDays(monday, 6).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" });
}
function formatToday() {
  const t = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function dateDisplay(v) {
  if (!isIsoDate(v)) return "Chưa xếp";
  if (v === iso(new Date())) return "Hôm nay";
  if (v === iso(addDays(new Date(), 1))) return "Ngày mai";
  if (v === iso(addDays(new Date(), -1))) return "Hôm qua";
  return new Date(v + "T00:00:00").toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
}
function dateLong(v) {
  if (!isIsoDate(v)) return "Chưa xếp";
  return new Date(v + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function daysFromToday(v) {
  if (!isIsoDate(v)) return null;
  return Math.round((new Date(v + "T00:00:00") - new Date(iso(new Date()) + "T00:00:00")) / 86400000);
}
function deadlineText(v) {
  const d = daysFromToday(v);
  if (d === null) return { text: "Chưa đặt hạn", tone: "" };
  if (d < 0) return { text: "Quá hạn " + Math.abs(d) + " ngày", tone: "overdue" };
  if (d === 0) return { text: "Hạn hôm nay", tone: "soon" };
  if (d <= 7) return { text: "Còn " + d + " ngày", tone: "soon" };
  return { text: "Hạn " + new Date(v + "T00:00:00").toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric" }), tone: "" };
}
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/* ===================== data ===================== */
function defaultData() {
  return { schemaVersion: SCHEMA_VERSION, objectives: [], routines: [], loose: [], trash: [], meta: { updatedAt: new Date().toISOString() } };
}
function str(v, fallback) { const t = typeof v === "string" ? v.trim() : ""; return t || fallback; }

function cleanTask(raw, monday) {
  const t = raw && typeof raw === "object" ? raw : {};
  let date = isIsoDate(t.date) ? t.date : null;
  if (!date && typeof t.day === "number" && t.day >= 0 && t.day <= 6) date = iso(addDays(monday, t.day));
  return {
    id: str(t.id, uid()),
    title: str(t.title, "Việc chưa đặt tên"),
    note: typeof t.note === "string" ? t.note : "",
    priority: t.priority === "high" ? "high" : "low",
    done: Boolean(t.done),
    date,
    /* v2 có field `type: fixed|flex` nhưng UI chưa bao giờ ghi vào. v3 thay bằng
       cặp date + time: không ngày = kho · có ngày, không giờ = linh hoạt trong
       ngày · có ngày + giờ = cố định. */
    time: isTime(t.time) ? t.time : null
  };
}
function cleanMetric(raw) {
  if (!raw || typeof raw !== "object") return null;
  const target = Number(raw.target);
  if (!Number.isFinite(target) || target <= 0) return null;
  const current = Number(raw.current);
  return { current: Number.isFinite(current) ? current : 0, target, unit: str(raw.unit, "") };
}
function migrate(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Dữ liệu không đúng định dạng Rootwork.");
  const monday = startOfWeek(new Date());
  const objectives = Array.isArray(raw.objectives) ? raw.objectives.map(o => {
    const item = o && typeof o === "object" ? o : {};
    return {
      id: str(item.id, uid()),
      title: str(item.title, "Objective chưa đặt tên"),
      deadline: isIsoDate(item.deadline) ? item.deadline : null,
      archived: Boolean(item.archived),
      krs: Array.isArray(item.krs) ? item.krs.map(k => {
        const kr = k && typeof k === "object" ? k : {};
        return {
          id: str(kr.id, uid()),
          title: str(kr.title, "Key Result chưa đặt tên"),
          metric: cleanMetric(kr.metric),
          tasks: Array.isArray(kr.tasks) ? kr.tasks.map(t => cleanTask(t, monday)) : []
        };
      }) : []
    };
  }) : [];
  const loose = Array.isArray(raw.loose) ? raw.loose.map(t => cleanTask(t, monday)) : [];
  const routines = Array.isArray(raw.routines) ? raw.routines.map(r => {
    const item = r && typeof r === "object" ? r : {};
    const log = {};
    if (item.log && typeof item.log === "object" && !Array.isArray(item.log)) {
      Object.keys(item.log).forEach(k => { if (isIsoDate(k) && item.log[k]) log[k] = true; });
    }
    const target = Number(item.target);
    return { id: str(item.id, uid()), name: str(item.name, "Thói quen chưa đặt tên"),
      target: clamp(Number.isFinite(target) ? Math.round(target) : 3, 1, 7), log };
  }) : [];
  const cutoff = Date.now() - TRASH_DAYS * 86400000;
  const trash = Array.isArray(raw.trash)
    ? raw.trash.filter(e => e && typeof e === "object" && e.payload && Date.parse(e.deletedAt) > cutoff) : [];
  return {
    schemaVersion: SCHEMA_VERSION, objectives, routines, loose, trash,
    meta: { updatedAt: raw.meta && typeof raw.meta.updatedAt === "string" ? raw.meta.updatedAt : new Date().toISOString() }
  };
}

const storage = {
  test() {
    const k = "rootwork:test:" + Date.now();
    try { localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch (e) { return false; }
  },
  load() { const raw = localStorage.getItem(STORAGE_KEY); return raw ? migrate(JSON.parse(raw)) : null; },
  save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
};

/* ===================== derived ===================== */
function flattenTasks(data) {
  const out = [];
  data.objectives.forEach(o => {
    if (o.archived) return;
    (o.krs || []).forEach(kr => (kr.tasks || []).forEach(t => {
      out.push({ ...t, loose: false, objId: o.id, krId: kr.id, source: o.title, krTitle: kr.title });
    }));
  });
  (data.loose || []).forEach(t => out.push({ ...t, loose: true, source: "Phát sinh", krTitle: "" }));
  return out;
}
function taskRef(data, task) {
  if (task.loose) return data.loose.find(i => i.id === task.id);
  const o = data.objectives.find(i => i.id === task.objId);
  const kr = o && o.krs.find(i => i.id === task.krId);
  return kr && kr.tasks.find(i => i.id === task.id);
}
function removeTask(draft, task) {
  if (task.loose) { draft.loose = draft.loose.filter(i => i.id !== task.id); return; }
  const o = draft.objectives.find(i => i.id === task.objId);
  const kr = o && o.krs.find(i => i.id === task.krId);
  if (kr) kr.tasks = kr.tasks.filter(i => i.id !== task.id);
}
function placeTask(draft, dest, task) {
  if (dest === "loose") { draft.loose.push(task); return; }
  const [objId, krId] = dest.split("::");
  const o = draft.objectives.find(i => i.id === objId);
  const kr = o && o.krs.find(i => i.id === krId);
  if (kr) kr.tasks.push(task); else draft.loose.push(task);
}
function sortDay(list) {
  return list.slice().sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (Boolean(a.time) !== Boolean(b.time)) return a.time ? -1 : 1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
    return 0;
  });
}
function krPercent(kr) {
  if (kr.metric) return clamp(Math.round(kr.metric.current / kr.metric.target * 100), 0, 100);
  const tasks = kr.tasks || [];
  return tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0;
}
function objectivePercent(o) {
  const krs = o.krs || [];
  return krs.length ? Math.round(krs.reduce((s, kr) => s + krPercent(kr), 0) / krs.length) : 0;
}
function overallPercent(data) {
  const live = data.objectives.filter(o => !o.archived);
  return live.length ? Math.round(live.reduce((s, o) => s + objectivePercent(o), 0) / live.length) : 0;
}
function overdueTasks(data) {
  const today = iso(new Date());
  return flattenTasks(data).filter(t => !t.done && t.date && t.date < today).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
    return a.date.localeCompare(b.date);
  });
}
/* Streak đếm theo TUẦN đạt target, không phải ngày liên tiếp — vì target là
   "n lần mỗi tuần". Đếm ngày liên tiếp luôn trả về 1 cho người đặt 3 lần/tuần
   rồi làm đúng 3 lần cách quãng, tức là phạt người dùng đúng. */
function weekStreak(routine) {
  const target = routine.target || 3;
  const hitsOf = m => DOW.reduce((s, _, i) => s + (routine.log[iso(addDays(m, i))] ? 1 : 0), 0);
  let streak = 0;
  let monday = startOfWeek(new Date());
  if (hitsOf(monday) < target) monday = addDays(monday, -7);
  while (hitsOf(monday) >= target) { streak += 1; monday = addDays(monday, -7); }
  return streak;
}
function weekMetrics(data, monday) {
  const dates = new Set(DOW.map((_, i) => iso(addDays(monday, i))));
  const tasks = flattenTasks(data).filter(t => t.date && dates.has(t.date));
  const high = tasks.filter(t => t.priority === "high");
  const rows = data.routines.map(r => ({
    hits: DOW.reduce((s, _, i) => s + (r.log[iso(addDays(monday, i))] ? 1 : 0), 0), target: r.target || 3
  }));
  const targetTotal = rows.reduce((s, r) => s + r.target, 0);
  const hits = rows.reduce((s, r) => s + r.hits, 0);
  return {
    tasks, total: tasks.length, done: tasks.filter(t => t.done).length,
    percent: tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0,
    high, highDone: high.filter(t => t.done).length,
    routinePercent: targetTotal ? clamp(Math.round(hits / targetTotal * 100), 0, 100) : 0
  };
}
function filled(p) { const v = clamp(Number(p) || 0, 0, 100); return v === 0 ? 0 : clamp(Math.round(v / 25), 1, 4); }

/* ===================== shared UI ===================== */
function Progress({ value }) {
  const v = clamp(Number(value) || 0, 0, 100);
  return h("div", { className: "progress", "aria-label": v + "%" }, h("span", { style: { width: v + "%" } }));
}
function Check({ done, onClick }) {
  return h("button", {
    type: "button", className: "check" + (done ? " done" : ""),
    onClick: e => { e.stopPropagation(); onClick(); },
    "aria-label": done ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành", "aria-pressed": done
  });
}
function SegmentBar({ percent }) {
  const on = filled(percent);
  return h("div", { className: "segment-bar", "aria-hidden": "true" },
    Array.from({ length: 4 }, (_, i) => h("span", { key: i, className: i < on ? "on" : "" })));
}
function Switch({ on, onChange, label }) {
  return h("button", { type: "button", className: "switch" + (on ? " on" : ""), onClick: onChange, "aria-pressed": on, "aria-label": label });
}
function EditableText({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) onSave(next); else setDraft(value);
    setEditing(false);
  };
  if (editing) return h("input", {
    className: "txt", autoFocus: true, value: draft,
    onChange: e => setDraft(e.target.value), onBlur: commit,
    onKeyDown: e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }
  });
  return h("button", { type: "button", className: "editable-line", onClick: () => setEditing(true), title: "Chạm để sửa" },
    h("span", { className: "editable-value" }, value));
}
function ScreenHeader({ title, subtitle, onBack, actions }) {
  return h("header", { className: "screen-head" },
    h("div", { className: "screen-head-left" },
      onBack && h("button", { className: "back-btn", type: "button", onClick: onBack, "aria-label": "Quay lại" }, h(Icon, { name: "back", size: 22 })),
      h("div", { style: { minWidth: 0 } },
        h("h1", { className: "screen-title" }, title),
        subtitle && h("div", { className: "screen-sub" }, subtitle))),
    actions && h("div", { className: "screen-actions" }, actions));
}
function EmptyState({ title, text, action }) {
  return h("div", { className: "empty" }, h("h3", null, title), text && h("p", null, text), action);
}
function Sheet({ title, onClose, children, headAction }) {
  useEffect(() => {
    const l = e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", l);
    return () => window.removeEventListener("keydown", l);
  }, [onClose]);
  return h("div", { className: "scrim", role: "presentation", onMouseDown: e => { if (e.target === e.currentTarget) onClose(); } },
    h("section", { className: "sheet", role: "dialog", "aria-modal": "true", "aria-label": title },
      h("div", { className: "sheet-grip", "aria-hidden": "true" }),
      h("div", { className: "sheet-head" },
        h("button", { className: "sheet-x", type: "button", onClick: onClose, "aria-label": "Đóng" }, h(Icon, { name: "close" })),
        h("h2", { className: "sheet-title" }, title),
        headAction || h("span", { style: { width: 44, flex: "none" } })),
      children));
}

/* Vuốt phải = hoãn +1 ngày · vuốt trái = xoá.
   Chỉ nhận cử chỉ ngang, nhường trục dọc cho cuộn trang. */
function Swipe({ onLeft, onRight, leftLabel, rightLabel, children }) {
  const [dx, setDx] = useState(0);
  const [settling, setSettling] = useState(false);
  const st = useRef(null);
  const THRESHOLD = 76;
  const down = e => {
    if (e.pointerType === "mouse") return;
    st.current = { x: e.clientX, y: e.clientY, axis: null };
    setSettling(false);
  };
  const move = e => {
    const s = st.current;
    if (!s) return;
    const mx = e.clientX - s.x, my = e.clientY - s.y;
    if (!s.axis) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      s.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
    }
    if (s.axis !== "x") return;
    setDx(clamp(mx, onLeft ? -140 : 0, onRight ? 140 : 0));
  };
  const up = () => {
    const s = st.current;
    st.current = null;
    setSettling(true);
    if (s && s.axis === "x") {
      if (dx <= -THRESHOLD && onLeft) { setDx(0); onLeft(); return; }
      if (dx >= THRESHOLD && onRight) { setDx(0); onRight(); return; }
    }
    setDx(0);
  };
  return h("div", { className: "swipe" },
    dx !== 0 && h("div", { className: "swipe-back", "aria-hidden": "true" },
      h("div", { className: "swipe-act defer", style: { opacity: dx > 0 ? 1 : 0 } }, rightLabel || ""),
      h("div", { className: "swipe-act del", style: { opacity: dx < 0 ? 1 : 0 } }, leftLabel || "")),
    h("div", {
      className: "swipe-front" + (settling ? " settling" : ""),
      style: { transform: "translateX(" + dx + "px)" },
      onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up
    }, children));
}


function RingProgress({ value, size }) {
  const v = clamp(Number(value) || 0, 0, 100);
  const dim = size || 86;
  const r = 31, c = 2 * Math.PI * r;
  return h("div", { className: "ring-wrap", style: { width: dim, height: dim } },
    h("svg", { viewBox: "0 0 76 76", width: dim, height: dim, "aria-hidden": "true" },
      h("circle", { className: "ring-track", cx: 38, cy: 38, r, fill: "none" }),
      h("circle", { className: "ring-value", cx: 38, cy: 38, r, fill: "none",
        strokeDasharray: c, strokeDashoffset: c * (1 - v / 100), transform: "rotate(-90 38 38)" })),
    h("strong", null, v + "%"));
}

function TrendSpark({ values }) {
  const list = Array.isArray(values) && values.length ? values : [0];
  const w = 260, hgt = 74, pad = 6;
  const max = 100, min = 0;
  const pts = list.map((v, i) => {
    const x = list.length === 1 ? w / 2 : pad + i * (w - pad * 2) / (list.length - 1);
    const y = hgt - pad - (clamp(v, min, max) - min) / (max - min) * (hgt - pad * 2);
    return x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
  return h("svg", { className: "trend-spark", viewBox: "0 0 260 74", preserveAspectRatio: "none", "aria-hidden": "true" },
    h("line", { x1: 0, y1: 68, x2: 260, y2: 68, className: "spark-base" }),
    h("polyline", { points: pts, fill: "none", className: "spark-line" }));
}

function BottomNav({ view, setView }) {
  const items = [
    { id: "home", label: "Tổng quan", icon: "home" },
    { id: "today", label: "Hôm nay", icon: "calendar" },
    { id: "targets", label: "Mục tiêu", icon: "target" },
    { id: "routines", label: "Thói quen", icon: "repeat" },
    { id: "week", label: "Cả tuần", icon: "grid" }
  ];
  return h("nav", { className: "bottom-nav", "aria-label": "Điều hướng chính" },
    items.map(item => h("button", { key: item.id, type: "button",
      className: "bottom-nav-item" + (view === item.id ? " on" : ""),
      onClick: () => setView(item.id), "aria-current": view === item.id ? "page" : undefined },
      h(Icon, { name: item.icon, size: 20, width: 1.8 }),
      h("span", null, item.label))));
}

function MiniStat({ label, value, sub }) {
  return h("div", { className: "mini-stat" },
    h("strong", null, value),
    h("span", null, label),
    sub && h("small", null, sub));
}

/* ===================== app ===================== */
function App() {
  const [data, setData] = useState(null);
  const [view, setView] = useState("home");
  const [weekOffset, setWeekOffset] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [storageError, setStorageError] = useState("");
  const [saveBlocked, setSaveBlocked] = useState(false);
  const [undo, setUndo] = useState(null);
  const loaded = useRef(false);
  const undoTimer = useRef(null);
  const dataRef = useRef(null);
  dataRef.current = data;

  useEffect(() => {
    try {
      if (!storage.test()) {
        setStorageError("Trình duyệt đang chặn bộ nhớ cục bộ. Thay đổi trong phiên này sẽ mất khi đóng app.");
        setSaveBlocked(true); setData(defaultData());
      } else {
        setData(storage.load() || defaultData());
        /* Không có dòng này, iOS có quyền dọn sạch localStorage sau vài ngày
           không mở app. */
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      }
    } catch (e) {
      setStorageError("Không đọc được dữ liệu đã lưu. Rootwork đang chạy tạm và chưa ghi đè kho cũ.");
      setSaveBlocked(true); setData(defaultData());
    } finally { loaded.current = true; }
  }, []);

  useEffect(() => {
    if (!loaded.current || !data || saveBlocked) return undefined;
    const t = setTimeout(() => {
      try { storage.save(data); setStorageError(""); }
      catch (e) {
        setStorageError("Không ghi được thay đổi vào thiết bị này. Dữ liệu mới chỉ tồn tại trong phiên đang mở.");
        setSaveBlocked(true);
      }
    }, 80);
    return () => clearTimeout(t);
  }, [data, saveBlocked]);

  useEffect(() => {
    const l = e => {
      const t = e.target;
      if (!t || sheet || e.ctrlKey || e.metaKey || e.altKey) return;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable) return;
      if (e.key === "1") { setView("targets"); e.preventDefault(); }
      if (e.key === "2") { setView("today"); e.preventDefault(); }
      if (e.key === "3") { setView("routines"); e.preventDefault(); }
      if (e.key === "4") { setView("week"); e.preventDefault(); }
      if (e.key.toLowerCase() === "n") { setSheet({ mode: "new", presetDate: iso(new Date()) }); e.preventDefault(); }
      if (e.key === "Escape" && view !== "home") setView("home");
    };
    window.addEventListener("keydown", l);
    return () => window.removeEventListener("keydown", l);
  }, [view, sheet]);

  const showUndo = (label, snapshot) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndo({ label, snapshot });
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  };
  /* Ảnh chụp hoàn tác lấy NGOÀI updater — hàm truyền vào setState phải thuần
     khiết, React có quyền gọi lại nhiều lần. */
  const mutate = useCallback((change, options) => {
    if (options && options.undoLabel && dataRef.current) showUndo(options.undoLabel, deepClone(dataRef.current));
    setData(prev => {
      const next = deepClone(prev);
      change(next);
      next.schemaVersion = SCHEMA_VERSION;
      next.meta = { ...(next.meta || {}), updatedAt: new Date().toISOString() };
      return next;
    });
  }, []);
  const undoLast = () => {
    if (!undo) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setData(deepClone(undo.snapshot)); setUndo(null);
  };

  function exportData() {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ format: "rootwork-backup", schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rootwork-" + iso(new Date()) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url); setMenuOpen(false);
  }
  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const next = migrate(parsed && parsed.data ? parsed.data : parsed);
        showUndo("Đã nạp bản sao lưu", deepClone(dataRef.current));
        setData(next); setMenuOpen(false);
      } catch (e) {
        setStorageError("Tệp không đọc được. Chọn tệp .json do chính Rootwork xuất ra.");
      }
    };
    reader.readAsText(file);
  }

  if (!data) return h("div", { className: "loading" }, "Đang mở Rootwork…");

  const goHome = () => setView("home");
  const openTask = task => setSheet({ mode: "edit", task });
  const openNew = preset => setSheet({ mode: "new", presetDate: preset === undefined ? iso(new Date()) : preset });

  let content;
  if (view === "targets") content = h(TargetsView, { data, mutate, openTask });
  else if (view === "today") content = h(TodayView, { data, mutate, openWeek: () => setView("week"), openTask, openNew });
  else if (view === "week") content = h(WeekView, { data, mutate, weekOffset, setWeekOffset, openTask, openNew });
  else if (view === "routines") content = h(RoutinesView, { data, mutate });
  else if (view === "trash") content = h(TrashView, { data, mutate, onBack: goHome });
  else content = h(HomeView, { data, storageError, setView, menuOpen, setMenuOpen, exportData, importData });

  return h(Fragment, null,
    h("main", { className: "app-shell" },
      view !== "home" && storageError && h("div", { className: "notice danger" },
        h("div", null, h("strong", null, "Dữ liệu chưa được lưu"), h("p", null, storageError))),
      content),
    view !== "trash" && h(BottomNav, { view, setView }),
    h("button", { className: "fab", type: "button", onClick: () => openNew(), title: "Thêm việc (phím N)", "aria-label": "Thêm việc" }),
    sheet && h(TaskSheet, { data, mutate, spec: sheet, onClose: () => setSheet(null) }),
    undo && h("div", { className: "toast", role: "status" },
      h("span", null, undo.label),
      h("button", { type: "button", onClick: undoLast }, "Hoàn tác")));
}

/* ===================== home ===================== */
function HomeView({ data, storageError, setView, menuOpen, setMenuOpen, exportData, importData }) {
  const monday = startOfWeek(new Date());
  const metrics = weekMetrics(data, monday);
  const today = iso(new Date());
  const flat = flattenTasks(data);
  const todayTasks = sortDay(flat.filter(t => t.date === today));
  const pending = todayTasks.filter(t => !t.done);
  const done = todayTasks.length - pending.length;
  const percent = todayTasks.length ? Math.round(done / todayTasks.length * 100) : 0;
  const now = new Date().toTimeString().slice(0, 5);
  const next = pending.find(t => t.time && t.time >= now) || pending.find(t => t.priority === "high") || pending[0] || null;
  const overdue = overdueTasks(data);
  const unscheduled = flat.filter(t => !t.date && !t.done);
  const objectives = data.objectives.filter(o => !o.archived);
  const featured = objectives.slice().sort((a, b) => {
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    if (a.deadline) return -1; if (b.deadline) return 1;
    return objectivePercent(b) - objectivePercent(a);
  })[0] || null;
  const routineHits = data.routines.filter(r => r.log[today]).length;
  const bestStreak = data.routines.reduce((m, r) => Math.max(m, weekStreak(r)), 0);
  const highPct = metrics.high.length ? Math.round(metrics.highDone / metrics.high.length * 100) : 100;
  const rhythm = Math.round(metrics.percent * .5 + highPct * .3 + metrics.routinePercent * .2);
  const attention = [];
  if (overdue.length) attention.push({ tone: "danger", title: overdue.length + " việc đã quá hạn", text: "Xử lý lịch hoặc bỏ những việc không còn đáng làm.", action: "week" });
  if (unscheduled.length) attention.push({ tone: "warning", title: unscheduled.length + " việc chưa xếp lịch", text: "Đưa chúng vào một ngày cụ thể hoặc giữ trong backlog.", action: "week" });
  const near = objectives.filter(o => { const d = daysFromToday(o.deadline); return d !== null && d >= 0 && d <= 7 && objectivePercent(o) < 100; });
  if (near.length) attention.push({ tone: "warning", title: near.length + " mục tiêu còn ≤ 7 ngày", text: "Kiểm tra lại KR và việc còn lại trước deadline.", action: "targets" });

  return h(Fragment, null,
    h("header", { className: "dashboard-head" },
      h("div", null,
        h("div", { className: "eyebrow" }, "Chào mày"),
        h("h1", { className: "dash-title" }, "Hôm nay"),
        h("div", { className: "dash-date" }, formatToday())),
      h("div", { className: "menu-wrap" },
        h("button", { type: "button", className: "icon-btn soft", onClick: () => setMenuOpen(!menuOpen), "aria-label": "Mở menu", "aria-expanded": menuOpen }, h(Icon, { name: "menu" })),
        menuOpen && h(Fragment, null,
          h("div", { className: "backdrop-lite", onClick: () => setMenuOpen(false) }),
          h("div", { className: "menu-card" },
            h("button", { type: "button", onClick: () => { setMenuOpen(false); setView("trash"); } }, h(Icon, { name: "trash" }), "Đã xoá gần đây", data.trash.length ? " · " + data.trash.length : ""),
            h("div", { className: "menu-sep" }),
            h("button", { type: "button", onClick: exportData }, h(Icon, { name: "download" }), "Xuất bản sao lưu"),
            h("label", null, h(Icon, { name: "upload" }), "Nạp bản sao lưu",
              h("input", { type: "file", accept: "application/json,.json", className: "sr-only",
                onChange: e => { importData(e.target.files && e.target.files[0]); e.target.value = ""; } })))))),

    storageError && h("div", { className: "notice danger" },
      h("div", null, h("strong", null, "Dữ liệu chưa được lưu"), h("p", null, storageError))),

    h("section", { className: "dash-card progress-card" },
      h("div", { className: "section-kicker" }, "Tiến độ hôm nay"),
      h("div", { className: "progress-hero" },
        h(RingProgress, { value: percent }),
        h("div", { className: "progress-copy" },
          h("div", { className: "progress-fraction" }, done + " / " + todayTasks.length),
          h("div", { className: "progress-label" }, "việc hoàn thành"),
          h("p", null, pending.length ? "Còn " + pending.length + " việc để khép ngày theo kế hoạch." : "Không còn việc nào đang chờ hôm nay."))),
      next && h("div", { className: "next-action" },
        h("div", null,
          h("span", null, "Việc tiếp theo"),
          h("strong", null, next.time ? next.time + " · " + next.title : next.title),
          h("small", null, next.source + (next.krTitle ? " · " + next.krTitle : ""))),
        h("button", { className: "btn primary sm", onClick: () => setView("today") }, "Bắt đầu"))),

    featured && h("section", { className: "dash-card objective-pulse", onClick: () => setView("targets"), role: "button", tabIndex: 0 },
      h("div", { className: "card-headline" },
        h("div", null, h("div", { className: "section-kicker" }, "Mục tiêu gần hạn"), h("h2", null, featured.title)),
        h("strong", { className: "accent-number" }, objectivePercent(featured) + "%")),
      h(Progress, { value: objectivePercent(featured) }),
      h("div", { className: "objective-pulse-meta" },
        h("span", null, featured.deadline ? "Hạn " + dateDisplay(featured.deadline) : "Chưa đặt hạn"),
        h("span", null, (featured.krs || []).length + " key result"))),

    h("section", { className: "dash-card" },
      h("div", { className: "section-kicker" }, "Tuần này"),
      h("div", { className: "week-stat-grid" },
        h(MiniStat, { value: metrics.done + "/" + metrics.total, label: "Hoàn thành", sub: "việc" }),
        h(MiniStat, { value: routineHits + "/" + data.routines.length, label: "Thói quen", sub: "hôm nay" }),
        h(MiniStat, { value: metrics.highDone + "/" + metrics.high.length, label: "Tập trung", sub: "ưu tiên cao" }),
        h(MiniStat, { value: rhythm, label: "Điểm nhịp", sub: "0–100" })),
      h("button", { className: "text-action", onClick: () => setView("week") }, "Xem cả tuần", h(Icon, { name: "arrow", size: 17 }))),

    h("section", { className: "dash-card attention-card" },
      h("div", { className: "card-headline" },
        h("div", null, h("div", { className: "section-kicker" }, "Cần chú ý"), h("h2", null, attention.length ? attention.length + " điểm cần quyết định" : "Mọi thứ đang gọn")),
        bestStreak > 0 && h("span", { className: "streak-badge" }, bestStreak + " tuần streak")),
      attention.length === 0
        ? h("p", { className: "muted-copy" }, "Không có overdue, backlog hoặc deadline gần cần xử lý.")
        : h("div", { className: "attention-list" }, attention.slice(0, 3).map((a, i) =>
            h("button", { key: i, className: "attention-row " + a.tone, onClick: () => setView(a.action) },
              h("span", { className: "attention-dot" }),
              h("span", { className: "attention-copy" }, h("strong", null, a.title), h("small", null, a.text)),
              h(Icon, { name: "chevron", size: 17 })))))
  );
}

/* ===================== task row ===================== */
function TaskRow({ task, mutate, onOpen, showSource }) {
  const late = task.date && !task.done && task.date < iso(new Date());
  const toggle = () => mutate(d => { const r = taskRef(d, task); if (r) r.done = !r.done; });
  const defer = () => mutate(d => {
    const r = taskRef(d, task);
    if (r) r.date = iso(addDays(r.date ? new Date(r.date + "T00:00:00") : new Date(), 1));
  }, { undoLabel: "Đã hoãn “" + task.title + "”" });
  const remove = () => mutate(d => {
    removeTask(d, task);
    d.trash.push({ id: uid(), deletedAt: new Date().toISOString(), kind: "task", label: task.title, payload: deepClone(task) });
  }, { undoLabel: "Đã xoá “" + task.title + "”" });

  return h(Swipe, { onLeft: remove, onRight: defer, leftLabel: "Xoá", rightLabel: "Hoãn 1 ngày" },
    h("div", { className: "task", onClick: onOpen, role: "button", tabIndex: 0, onKeyDown: e => { if (e.key === "Enter") onOpen(); } },
      h("span", { className: "bar-hi" + (task.priority === "high" && !task.done ? "" : " off"), "aria-hidden": "true" }),
      h(Check, { done: task.done, onClick: toggle }),
      h("div", { className: "task-body" },
        h("div", { className: "task-name" + (task.done ? " done" : task.priority === "high" ? " hi" : "") }, task.title),
        h("div", { className: "task-sub" },
          task.time && h("span", { className: "time-badge" }, task.time),
          h("span", { className: late ? "late" : "" }, dateDisplay(task.date)),
          showSource && h("span", null, task.source + (task.krTitle ? " · " + task.krTitle : "")),
          task.note && h("span", null, "có ghi chú")))));
}

/* ===================== task sheet =====================
   Khối Ngày / Giờ tách rời là thứ thay cho field `type` chết trong v2.
   Ô chọn ngày và các chip nằm ở hàng riêng bên dưới, không chen ngang —
   chen ngang là lý do "Hôm nay" bị bẻ thành hai dòng. */
function TaskSheet({ data, mutate, spec, onClose }) {
  const editing = spec.mode === "edit";
  const src = editing ? spec.task : null;
  const [title, setTitle] = useState(src ? src.title : "");
  const [note, setNote] = useState(src ? src.note : "");
  const [priority, setPriority] = useState(src ? src.priority : "low");
  const [date, setDate] = useState(src ? src.date : (isIsoDate(spec.presetDate) ? spec.presetDate : null));
  const [time, setTime] = useState(src ? src.time : null);

  const dests = [{ id: "loose", label: "Phát sinh — không thuộc mục tiêu" }];
  data.objectives.filter(o => !o.archived).forEach(o => (o.krs || []).forEach(kr =>
    dests.push({ id: o.id + "::" + kr.id, label: o.title + " · " + kr.title })));
  /* Mặc định "Phát sinh": lúc ghi vội không ai muốn quyết định việc này thuộc
     mục tiêu nào. Phân loại là việc làm sau. */
  const [dest, setDest] = useState(editing && !src.loose ? src.objId + "::" + src.krId : "loose");

  const today = iso(new Date());
  const tomorrow = iso(addDays(new Date(), 1));
  const commit = () => {
    const name = title.trim();
    if (!name) return;
    const payload = { title: name, note: note.trim(), priority, date, time: date ? time : null };
    mutate(draft => {
      if (editing) {
        const r = taskRef(draft, src);
        const current = src.loose ? "loose" : src.objId + "::" + src.krId;
        if (r && dest === current) { Object.assign(r, payload); return; }
        const moved = { id: src.id, done: r ? r.done : false, ...payload };
        removeTask(draft, src);
        placeTask(draft, dest, moved);
      } else {
        placeTask(draft, dest, { id: uid(), done: false, ...payload });
      }
    });
    onClose();
  };
  const remove = () => {
    mutate(draft => {
      removeTask(draft, src);
      draft.trash.push({ id: uid(), deletedAt: new Date().toISOString(), kind: "task", label: src.title, payload: deepClone(src) });
    }, { undoLabel: "Đã xoá “" + src.title + "”" });
    onClose();
  };

  return h(Sheet, {
    title: editing ? "Chi tiết việc" : "Việc mới", onClose,
    headAction: h("button", { className: "sheet-done", onClick: commit, disabled: !title.trim() }, editing ? "Xong" : "Thêm")
  },
    h("div", { className: "group" },
      h("input", {
        className: "sheet-title-input", autoFocus: !editing, value: title, placeholder: "Việc cần làm",
        onChange: e => setTitle(e.target.value), onKeyDown: e => { if (e.key === "Enter") commit(); }
      }),
      h("textarea", { className: "sheet-note", value: note, placeholder: "Ghi chú", onChange: e => setNote(e.target.value) })),

    h("div", { className: "group-label" }, "Ngày & giờ"),
    h("div", { className: "group" },
      h("div", { className: "row" },
        h("span", { className: "row-icon" }, h(Icon, { name: "calendar", size: 18 })),
        h("div", { className: "row-main" },
          h("div", { className: "row-label" }, "Ngày"),
          h("div", { className: "row-value" }, date ? dateLong(date) : "Chưa xếp lịch")),
        h(Switch, { on: Boolean(date), label: "Đặt ngày",
          onChange: () => { if (date) { setDate(null); setTime(null); } else setDate(today); } })),
      date && h("div", { className: "row-sub" },
        h("input", { className: "field", type: "date", value: date, "aria-label": "Chọn ngày",
          onChange: e => setDate(isIsoDate(e.target.value) ? e.target.value : null) }),
        h("div", { className: "chip-strip" },
          h("button", { className: "chip" + (date === today ? " on" : ""), onClick: () => setDate(today) }, "Hôm nay"),
          h("button", { className: "chip" + (date === tomorrow ? " on" : ""), onClick: () => setDate(tomorrow) }, "Ngày mai"),
          h("button", { className: "chip", onClick: () => setDate(iso(addDays(new Date(), 7))) }, "Tuần sau"))),
      h("div", { className: "row" },
        h("span", { className: "row-icon" }, h(Icon, { name: "clock", size: 18 })),
        h("div", { className: "row-main" },
          h("div", { className: "row-label" }, "Giờ cố định"),
          h("div", { className: "row-value" }, time ? "Bắt đầu lúc " + time : "Tự xếp trong ngày")),
        h(Switch, { on: Boolean(time), label: "Đặt giờ",
          onChange: () => { if (time) setTime(null); else { if (!date) setDate(today); setTime("09:00"); } } })),
      time && h("div", { className: "row-sub" },
        h("input", { className: "field", type: "time", value: time, "aria-label": "Chọn giờ",
          onChange: e => setTime(isTime(e.target.value) ? e.target.value : null) }))),

    h("div", { className: "group-label" }, "Phân loại"),
    h("div", { className: "group" },
      h("div", { className: "row" },
        h("span", { className: "row-icon" }, h(Icon, { name: "flag", size: 18 })),
        h("div", { className: "row-main" },
          h("div", { className: "row-label" }, "Ưu tiên cao"),
          h("div", { className: "row-value" }, priority === "high" ? "Lên đầu danh sách trong ngày" : "Mức thường")),
        h(Switch, { on: priority === "high", label: "Ưu tiên cao",
          onChange: () => setPriority(priority === "high" ? "low" : "high") })),
      h("div", { className: "row" },
        h("span", { className: "row-icon" }, h(Icon, { name: "target", size: 18 })),
        h("div", { className: "row-main" }, h("div", { className: "row-label" }, "Thuộc Key Result"))),
      h("div", { className: "row-sub" },
        h("select", { className: "field", value: dest, onChange: e => setDest(e.target.value), "aria-label": "Thuộc Key Result" },
          dests.map(d => h("option", { key: d.id, value: d.id }, d.label))))),

    editing && h("button", { className: "btn danger block", onClick: remove },
      h(Icon, { name: "trash", size: 18 }), "Xoá việc này"));
}

/* ===================== today ===================== */
function TodayView({ data, mutate, onBack, openWeek, openTask, openNew }) {
  const today = iso(new Date());
  const monday = startOfWeek(new Date());
  const weekDates = DOW.map((_, i) => iso(addDays(monday, i)));
  const [picked, setPicked] = useState(today);
  const flat = flattenTasks(data);
  const tasks = sortDay(flat.filter(t => t.date === picked));
  const fixed = tasks.filter(t => t.time);
  const flexible = tasks.filter(t => !t.time);
  const done = tasks.filter(t => t.done).length;
  const overdue = picked === today ? overdueTasks(data) : [];
  const pickedFuture = picked > today;
  const toggleRoutine = id => mutate(d => {
    if (pickedFuture) return;
    const r = d.routines.find(i => i.id === id);
    if (!r) return;
    if (r.log[picked]) delete r.log[picked]; else r.log[picked] = true;
  });
  const section = (label, list, empty) => h(Fragment, null,
    h("div", { className: "group-label" }, label),
    h("div", { className: "group day-task-group" }, list.length
      ? list.map(t => h(TaskRow, { key: (t.loose ? "l" : "t") + t.id, task: t, mutate, showSource: true, onOpen: () => openTask(t) }))
      : h("div", { className: "row quiet-row" }, h("div", { className: "row-main" }, h("div", { className: "row-value" }, empty)))));

  return h(Fragment, null,
    h(ScreenHeader, { title: picked === today ? "Hôm nay" : dateLong(picked),
      subtitle: done + " / " + tasks.length + " việc đã xong",
      actions: h("button", { className: "icon-btn soft", onClick: () => openNew(picked), "aria-label": "Thêm việc" }, h(Icon, { name: "plus" })) }),
    h("nav", { className: "day-strip compact", "aria-label": "Chọn ngày trong tuần" },
      DOW.map((day, i) => { const date = weekDates[i]; return h("button", { key: date, type: "button",
        className: "day-pick" + (date === picked ? " on" : "") + (date === today ? " today" : ""),
        onClick: () => setPicked(date), "aria-pressed": date === picked },
        h("span", { className: "day-pick-dow" }, day), h("span", { className: "day-pick-num" }, addDays(monday, i).getDate())); })),
    section("Việc có giờ cố định", fixed, "Không có lịch cố định."),
    section("Việc linh hoạt", flexible, "Không có việc linh hoạt trong ngày này."),
    overdue.length > 0 && h(Fragment, null,
      h("div", { className: "group-label danger-label" }, "Quá hạn · " + overdue.length),
      h("div", { className: "group overdue-group" }, overdue.map(t => h(TaskRow, { key: "o" + t.id, task: t, mutate, showSource: true, onOpen: () => openTask(t) })))),
    data.routines.length > 0 && h(Fragment, null,
      h("div", { className: "group-label" }, "Thói quen " + (picked === today ? "hôm nay" : dateDisplay(picked))),
      h("section", { className: "panel habit-check-panel" },
        h("div", { className: "routine-pills" }, data.routines.map(r => {
          const on = Boolean(r.log[picked]);
          return h("button", { key: r.id, type: "button", disabled: pickedFuture,
            className: "routine-pill" + (on ? " on" : "") + (pickedFuture ? " future" : ""),
            onClick: () => toggleRoutine(r.id), "aria-pressed": on },
            h("i", null, on && h(Icon, { name: "check", size: 12, width: 3 })), r.name);
        })) ))
  );
}

/* ===================== targets ===================== */
function TargetsView({ data, mutate, onBack, openTask }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [filter, setFilter] = useState("all");
  const [openMap, setOpenMap] = useState(() => {
    const m = {}; data.objectives.filter(o => !o.archived).forEach(o => { m[o.id] = true; }); return m;
  });
  const visible = data.objectives.filter(o => {
    const pct = objectivePercent(o);
    if (filter === "active") return !o.archived && pct < 100;
    if (filter === "done") return !o.archived && pct >= 100;
    if (filter === "archived") return o.archived;
    return !o.archived;
  });
  const add = () => {
    const t = title.trim(); if (!t) return;
    mutate(d => d.objectives.push({ id: uid(), title: t, deadline: isIsoDate(deadline) ? deadline : null, archived: false, krs: [] }));
    setTitle(""); setDeadline(""); setAdding(false);
  };
  return h(Fragment, null,
    h(ScreenHeader, { title: "Mục tiêu", subtitle: data.objectives.filter(o => !o.archived).length + " objective đang theo dõi",
      actions: h("button", { className: "icon-btn soft", onClick: () => setAdding(true), "aria-label": "Objective mới" }, h(Icon, { name: "plus" })) }),
    h("div", { className: "filter-tabs" },
      [["all","Tất cả"],["active","Đang thực hiện"],["done","Đã đạt"],["archived","Lưu trữ"]].map(([id,label]) =>
        h("button", { key:id, className:"filter-tab"+(filter===id?" on":""), onClick:()=>setFilter(id) }, label))),
    adding && h("div", { className: "panel add-objective-panel" },
      h("input", { className: "txt", autoFocus: true, placeholder: "Tên objective", value: title, onChange: e => setTitle(e.target.value),
        onKeyDown: e => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); } }),
      h("div", { className: "inline wrap", style: { marginTop: 10 } },
        h("input", { className: "txt grow", type: "date", value: deadline, "aria-label": "Hạn", onChange: e => setDeadline(e.target.value) }),
        h("button", { className: "btn primary", onClick: add }, "Tạo objective"),
        h("button", { className: "btn ghost", onClick: () => setAdding(false) }, "Huỷ"))),
    visible.length === 0 && !adding && h(EmptyState, { title: filter === "done" ? "Chưa có objective đạt 100%." : "Chưa có objective ở nhóm này.",
      text: filter === "all" || filter === "active" ? "Tạo Objective, đặt Key Result đo được, rồi mới sinh task." : "" }),
    h("div", { className: "objective-stack" }, visible.map(o => h(ObjectiveCard, { key: o.id, objective: o, mutate, openTask,
      open: Boolean(openMap[o.id]), setOpen: () => setOpenMap(p => ({ ...p, [o.id]: !p[o.id] })) })))
  );
}

function ObjectiveCard({ objective, mutate, open, setOpen, openTask }) {
  const percent = objectivePercent(objective);
  const due = deadlineText(objective.deadline);
  const patch = fn => mutate(d => fn(d.objectives.find(i => i.id === objective.id)));
  return h("article", { className: "objective" },
    h("div", { className: "objective-head" },
      h("button", { className: "caret" + (open ? " open" : ""), onClick: setOpen, "aria-expanded": open,
        "aria-label": open ? "Thu gọn" : "Mở rộng" }, h(Icon, { name: "chevron", size: 16, width: 2 })),
      h("div", { className: "objective-title-line" },
        h(EditableText, { value: objective.title, onSave: v => patch(o => { o.title = v; }) }),
        h("div", { className: "objective-meta" },
          h("span", { className: "due " + due.tone }, due.text),
          h("span", null, (objective.krs || []).length + " key result"))),
      h("div", { className: "objective-actions" },
        h("span", { className: "percent" }, percent + "%"),
        h("button", { className: "row-del plain", type: "button",
          title: objective.archived ? "Khôi phục" : "Lưu trữ",
          "aria-label": objective.archived ? "Khôi phục" : "Lưu trữ",
          onClick: () => patch(o => { o.archived = !o.archived; })
        }, h(Icon, { name: objective.archived ? "restore" : "archive", size: 18 })),
        h("button", { className: "row-del", type: "button", title: "Xoá objective", "aria-label": "Xoá objective",
          onClick: () => mutate(d => {
            const gone = d.objectives.find(i => i.id === objective.id);
            d.objectives = d.objectives.filter(i => i.id !== objective.id);
            d.trash.push({ id: uid(), deletedAt: new Date().toISOString(), kind: "objective", label: gone.title, payload: deepClone(gone) });
          }, { undoLabel: "Đã xoá objective" })
        }, h(Icon, { name: "trash", size: 18 })))),
    h(Progress, { value: percent }),
    open && h("div", { className: "objective-body" },
      h("div", { className: "inline wrap", style: { marginBottom: 16 } },
        h("span", { style: { color: "var(--muted)", fontSize: "var(--t-sm)" } }, "Hạn hoàn thành"),
        h("input", { className: "txt", type: "date", value: objective.deadline || "", style: { width: "auto" },
          "aria-label": "Hạn của objective",
          onChange: e => patch(o => { o.deadline = isIsoDate(e.target.value) ? e.target.value : null; }) })),
      (objective.krs || []).map(kr => h(KrBlock, { key: kr.id, objective, kr, mutate, openTask })),
      h(AddKr, { objective, mutate })));
}

function KrBlock({ objective, kr, mutate, openTask }) {
  const percent = krPercent(kr);
  const patch = fn => mutate(d => fn(d.objectives.find(i => i.id === objective.id).krs.find(i => i.id === kr.id)));
  const m = kr.metric;
  const tasks = sortDay((kr.tasks || []).map(t => ({
    ...t, loose: false, objId: objective.id, krId: kr.id, source: objective.title, krTitle: kr.title
  })));
  return h("section", { className: "kr" },
    h("div", { className: "kr-head" },
      h("span", { className: "kr-dot" }),
      h("div", { className: "kr-title" }, h(EditableText, { value: kr.title, onSave: v => patch(k => { k.title = v; }) })),
      h("span", { className: "kr-pct" }, percent + "%"),
      h("button", { className: "row-del", type: "button", title: "Xoá Key Result", "aria-label": "Xoá Key Result",
        onClick: () => mutate(d => {
          const o = d.objectives.find(i => i.id === objective.id);
          const gone = o.krs.find(i => i.id === kr.id);
          o.krs = o.krs.filter(i => i.id !== kr.id);
          d.trash.push({ id: uid(), deletedAt: new Date().toISOString(), kind: "kr", label: gone.title, payload: deepClone(gone), objId: objective.id });
        }, { undoLabel: "Đã xoá Key Result" })
      }, h(Icon, { name: "trash", size: 18 }))),
    /* Key Result phải đo được bằng con số. Không có chỉ số thì đây chỉ là một
       thư mục có thanh tiến độ. */
    h("div", { className: "kr-metric" },
      m
        ? h(Fragment, null,
            h("input", { className: "metric-num", type: "number", value: m.current, "aria-label": "Giá trị hiện tại",
              onChange: e => patch(k => { k.metric.current = Number(e.target.value) || 0; }) }),
            h("span", null, "/"),
            h("input", { className: "metric-num", type: "number", value: m.target, "aria-label": "Mục tiêu",
              onChange: e => patch(k => { k.metric.target = Math.max(1, Number(e.target.value) || 1); }) }),
            h("input", { className: "metric-unit", value: m.unit, placeholder: "đơn vị", "aria-label": "Đơn vị",
              onChange: e => patch(k => { k.metric.unit = e.target.value; }) }),
            h("button", { className: "btn ghost sm", onClick: () => patch(k => { k.metric = null; }) }, "Bỏ chỉ số"))
        : h("button", { className: "btn ghost sm", onClick: () => patch(k => { k.metric = { current: 0, target: 100, unit: "" }; }) },
            "Đặt chỉ số đo — đang tính theo số task xong")),
    h("div", { className: "kr-list" },
      tasks.map(t => h(TaskRow, { key: t.id, task: t, mutate, onOpen: () => openTask(t) })),
      h(Compose, { objective, kr, mutate })));
}

/* Nhập liền dòng: gõ tên → Enter là thêm, ô vẫn mở để gõ tiếp.
   Metadata gắn ngay bằng chip, không phải mở hộp thoại. */
function Compose({ objective, kr, mutate }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(null);
  const [high, setHigh] = useState(false);
  const inputRef = useRef(null);
  const today = iso(new Date());
  const tomorrow = iso(addDays(new Date(), 1));

  const add = () => {
    const t = value.trim();
    if (!t) { setOpen(false); return; }
    mutate(d => d.objectives.find(o => o.id === objective.id).krs.find(k => k.id === kr.id)
      .tasks.push({ id: uid(), title: t, note: "", priority: high ? "high" : "low", done: false, date, time: null }));
    setValue("");
    if (inputRef.current) inputRef.current.focus();
  };
  if (!open) return h("button", { className: "add-line", onClick: () => setOpen(true) },
    h(Icon, { name: "plus", size: 18, width: 2 }), "Thêm việc");
  const custom = date && date !== today && date !== tomorrow;
  return h("div", { className: "compose" },
    h("div", { className: "compose-top" },
      h("span", { className: "check", "aria-hidden": "true" }),
      h("input", { ref: inputRef, className: "compose-input", autoFocus: true, value, placeholder: "Việc cần làm",
        onChange: e => setValue(e.target.value),
        onKeyDown: e => { if (e.key === "Enter") add(); if (e.key === "Escape") { setValue(""); setOpen(false); } } }),
      h("button", { className: "chip", onClick: () => { add(); setOpen(false); } }, "Xong")),
    h("div", { className: "compose-bar" },
      h("button", { className: "chip" + (date === today ? " on" : ""), onClick: () => setDate(date === today ? null : today) }, "Hôm nay"),
      h("button", { className: "chip" + (date === tomorrow ? " on" : ""), onClick: () => setDate(date === tomorrow ? null : tomorrow) }, "Ngày mai"),
      h("label", { className: "chip" + (custom ? " on" : "") },
        h(Icon, { name: "calendar", size: 16 }), custom ? dateDisplay(date) : "Chọn ngày",
        h("input", { type: "date", value: date || "", "aria-label": "Chọn ngày",
          onChange: e => setDate(isIsoDate(e.target.value) ? e.target.value : null) })),
      h("button", { className: "chip" + (high ? " on" : ""), onClick: () => setHigh(!high) },
        h(Icon, { name: "flag", size: 16 }), "Ưu tiên")));
}

function AddKr({ objective, mutate }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const add = () => {
    const t = value.trim();
    if (!t) return;
    mutate(d => d.objectives.find(i => i.id === objective.id).krs.push({ id: uid(), title: t, metric: null, tasks: [] }));
    setValue(""); setAdding(false);
  };
  return h("div", null, adding
    ? h("div", { className: "inline wrap" },
        h("input", { className: "txt grow", autoFocus: true, placeholder: "Key Result", value,
          onChange: e => setValue(e.target.value),
          onKeyDown: e => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); } }),
        h("button", { className: "btn primary sm", onClick: add }, "Thêm KR"),
        h("button", { className: "btn ghost sm", onClick: () => { setAdding(false); setValue(""); } }, "Huỷ"))
    : h("button", { className: "btn ghost sm", onClick: () => setAdding(true) }, "Thêm Key Result"));
}

/* ===================== week ===================== */
function WeekView({ data, mutate, onBack, weekOffset, setWeekOffset, openTask, openNew }) {
  const monday = addDays(startOfWeek(new Date()), weekOffset * 7);
  const dates = DOW.map((_, i) => iso(addDays(monday, i)));
  const today = iso(new Date());
  const flat = flattenTasks(data);
  const unscheduled = flat.filter(t => !t.date && !t.done);
  const metrics = weekMetrics(data, monday);
  const highPct = metrics.high.length ? Math.round(metrics.highDone / metrics.high.length * 100) : 100;
  const rhythm = Math.round(metrics.percent * .55 + highPct * .25 + metrics.routinePercent * .20);
  const carry = weekOffset === 0 ? overdueTasks(data).filter(t => !dates.includes(t.date)) : [];
  return h(Fragment, null,
    h(ScreenHeader, { title: "Cả tuần", subtitle: formatRange(monday),
      actions: h("button", { className: "icon-btn soft", onClick: () => openNew(today), "aria-label": "Thêm việc" }, h(Icon, { name: "plus" })) }),
    h("div", { className: "week-nav centered" },
      h("button", { className: "btn sm", onClick: () => setWeekOffset(weekOffset - 1), "aria-label": "Tuần trước" }, h(Icon, { name: "back", size: 18 })),
      h("button", { className: "btn sm", onClick: () => setWeekOffset(0) }, "Tuần này"),
      h("button", { className: "btn sm", onClick: () => setWeekOffset(weekOffset + 1), "aria-label": "Tuần sau" }, h(Icon, { name: "chevron", size: 18 }))),
    h("section", { className: "dash-card week-overview" },
      h("div", { className: "section-kicker" }, "Tổng quan"),
      h("div", { className: "week-stat-grid" },
        h(MiniStat, { value: metrics.total, label: "Tổng việc" }),
        h(MiniStat, { value: metrics.done, label: "Hoàn thành", sub: metrics.percent + "%" }),
        h(MiniStat, { value: metrics.highDone + "/" + metrics.high.length, label: "Ưu tiên cao" }),
        h(MiniStat, { value: rhythm, label: "Điểm nhịp" }))),
    carry.length > 0 && h("div", { className: "notice warning" },
      h("div", null, h("strong", null, carry.length + " việc từ trước đang quá hạn"), h("p", null, "Chúng chưa thuộc tuần này nhưng vẫn cần một quyết định."))),
    h("div", { className: "group-label" }, "Kế hoạch theo ngày"),
    h("section", { className: "week-card-grid" }, DOW.map((day, i) => {
      const date = dates[i]; const tasks = sortDay(flat.filter(t => t.date === date)); const done = tasks.filter(t => t.done).length;
      return h("article", { className: "week-day-card" + (date === today ? " today" : ""), key: date },
        h("div", { className: "week-day-top" },
          h("div", null, h("strong", null, day + " " + addDays(monday, i).getDate()), h("span", null, tasks.length + " việc")),
          h("span", { className: "day-ratio" }, done + "/" + tasks.length)),
        h("div", { className: "dot-progress" }, Array.from({ length: Math.min(5, Math.max(tasks.length, 1)) }, (_, j) => h("span", { key:j, className:j<Math.min(done,5)?"on":"" }))),
        h("div", { className: "week-mini-list" }, tasks.slice(0, 3).map(t => h("button", { key:t.id, onClick:()=>openTask(t), className:"week-mini-task"+(t.done?" done":"") },
          t.time && h("b", null, t.time), h("span", null, t.title)))),
        tasks.length > 3 && h("small", { className: "more-count" }, "+" + (tasks.length - 3) + " việc khác"),
        h("button", { className: "day-add", onClick: () => openNew(date) }, "+ Thêm việc"));
    })),
    h("div", { className: "group-label" }, "Việc chưa lên kế hoạch · " + unscheduled.length),
    h("div", { className: "group backlog-group" }, unscheduled.length
      ? unscheduled.map(t => h(TaskRow, { key:(t.loose?"l":"t")+t.id, task:t, mutate, showSource:true, onOpen:()=>openTask(t) }))
      : h("div", { className:"row quiet-row" }, h("div", { className:"row-main" }, h("div", { className:"row-value" }, "Backlog đang trống."))))
  );
}

/* ===================== routines ===================== */
function RoutinesView({ data, mutate, onBack }) {
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const monday = startOfWeek(new Date());
  const today = iso(new Date());
  const weekDates = DOW.map((_, i) => iso(addDays(monday, i)));
  const [picked, setPicked] = useState(today);
  const pickedFuture = picked > today;
  const add = () => {
    const n = value.trim(); if (!n) return;
    mutate(d => d.routines.push({ id: uid(), name: n, target: 3, log: {} })); setValue(""); setAdding(false);
  };
  const toggle = (id, date) => { if (date > today) return; mutate(d => { const r = d.routines.find(i => i.id === id); if (!r) return;
    if (r.log[date]) delete r.log[date]; else r.log[date] = true; }); };
  const achieved = data.routines.filter(r => weekDates.reduce((s,d)=>s+(r.log[d]?1:0),0) >= (r.target||3)).length;
  const bestStreak = data.routines.reduce((m,r)=>Math.max(m,weekStreak(r)),0);
  const trend = Array.from({ length: 8 }, (_, k) => {
    const m = addDays(monday, (k - 7) * 7); let hit=0,target=0;
    data.routines.forEach(r => { target += r.target || 3; DOW.forEach((_,i)=>{ if(r.log[iso(addDays(m,i))]) hit++; }); });
    return target ? clamp(Math.round(hit/target*100),0,100) : 0;
  });
  return h(Fragment, null,
    h(ScreenHeader, { title: "Thói quen", subtitle: data.routines.length + " thói quen đang theo dõi",
      actions: h("button", { className:"icon-btn soft", onClick:()=>setAdding(true), "aria-label":"Thói quen mới" }, h(Icon,{name:"plus"})) }),
    data.routines.length > 0 && h("nav", { className:"day-strip compact", "aria-label":"Chọn ngày" }, DOW.map((day,i)=>{
      const date=weekDates[i], future=date>today; return h("button", { key:date, type:"button", disabled:future,
        className:"day-pick"+(date===picked?" on":"")+(date===today?" today":"")+(future?" future":""), onClick:()=>!future&&setPicked(date) },
        h("span",{className:"day-pick-dow"},day), h("span",{className:"day-pick-num"},addDays(monday,i).getDate())); })),
    data.routines.length > 0 && h("section", { className:"dash-card habit-summary" },
      h("div", { className:"card-headline" }, h("div",null,h("div",{className:"section-kicker"},"Tổng quan tuần"),h("h2",null,achieved+" / "+data.routines.length+" thói quen đạt")),
        h("span",{className:"streak-badge"},bestStreak+" tuần streak")),
      h(TrendSpark,{values:trend}),
      h("div",{className:"trend-labels"},h("span",null,"8 tuần trước"),h("span",null,"Tuần này"))),
    data.routines.length === 0 && !adding && h(EmptyState,{title:"Thói quen giữ nhịp.",text:"Đặt số lần mỗi tuần, tick theo ngày và theo dõi chuỗi tuần đạt mục tiêu.",
      action:h("button",{className:"btn primary",onClick:()=>setAdding(true)},"Thói quen đầu tiên")}),
    adding && h("div",{className:"panel"},h("div",{className:"inline wrap"},
      h("input",{className:"txt grow",autoFocus:true,placeholder:"Tên thói quen",value,onChange:e=>setValue(e.target.value),onKeyDown:e=>{if(e.key==="Enter")add();if(e.key==="Escape")setAdding(false);}}),
      h("button",{className:"btn primary",onClick:add},"Thêm"),h("button",{className:"btn ghost",onClick:()=>{setAdding(false);setValue("");}},"Huỷ"))),
    data.routines.map(r=>{
      const hits=weekDates.reduce((s,d)=>s+(r.log[d]?1:0),0), target=r.target||3, fill=clamp(Math.round(hits/target*100),0,100), on=Boolean(r.log[picked]), streak=weekStreak(r);
      return h("article",{className:"routine modern",key:r.id},
        h("div",{className:"routine-head"},h("div",{className:"routine-name"},h(EditableText,{value:r.name,onSave:n=>mutate(d=>{d.routines.find(i=>i.id===r.id).name=n;})})),
          h("button",{type:"button",className:"routine-toggle"+(on?" on":"")+(pickedFuture?" future":""),disabled:pickedFuture,onClick:()=>toggle(r.id,picked),"aria-pressed":on})),
        h("div",{className:"routine-meta"},streak>0?streak+" tuần liên tiếp đạt mục tiêu · ":"",hits+"/"+target+" tuần này"),
        h(Progress,{value:fill}),
        h("div",{className:"routine-controls"},
          h("div",{className:"routine-dots"},weekDates.map(d=>h("span",{key:d,className:"routine-dot"+(r.log[d]?" on":"")+(d===picked?" picked":"")}))),
          h("input",{className:"target-box",type:"number",min:1,max:7,value:target,"aria-label":"Số lần mỗi tuần",onChange:e=>mutate(d=>{d.routines.find(i=>i.id===r.id).target=clamp(Number(e.target.value)||1,1,7);})}),
          h("button",{className:"row-del",title:"Xoá thói quen","aria-label":"Xoá thói quen",onClick:()=>mutate(d=>{const gone=d.routines.find(i=>i.id===r.id);d.routines=d.routines.filter(i=>i.id!==r.id);d.trash.push({id:uid(),deletedAt:new Date().toISOString(),kind:"routine",label:gone.name,payload:deepClone(gone)});},{undoLabel:"Đã xoá thói quen"})},h(Icon,{name:"trash",size:18}))));
    })
  );
}

/* ===================== trash ===================== */
const KIND_LABEL = { task: "Việc", kr: "Key Result", objective: "Objective", routine: "Thói quen" };
function TrashView({ data, mutate, onBack }) {
  const items = data.trash.slice().sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  const restore = entry => mutate(d => {
    let restored = false;
    if (entry.kind === "objective") { d.objectives.push(entry.payload); restored = true; }
    else if (entry.kind === "routine") { d.routines.push(entry.payload); restored = true; }
    else if (entry.kind === "kr") {
      const o = d.objectives.find(i => i.id === entry.objId);
      if (o) { o.krs.push(entry.payload); restored = true; }
      // Nếu objective gốc không còn, giữ KR trong thùng rác thay vì làm mất dữ liệu.
    } else {
      const t = entry.payload;
      const o = t.objId && d.objectives.find(i => i.id === t.objId);
      const kr = o && o.krs.find(i => i.id === t.krId);
      if (kr) kr.tasks.push({ ...t }); else d.loose.push({ ...t });
      restored = true;
    }
    if (restored) d.trash = d.trash.filter(i => i.id !== entry.id);
  });
  return h(Fragment, null,
    h(ScreenHeader, { title: "Đã xoá gần đây", subtitle: "Tự dọn sau " + TRASH_DAYS + " ngày", onBack,
      actions: items.length > 0 && h("button", { className: "btn danger",
        onClick: () => mutate(d => { d.trash = []; }, { undoLabel: "Đã dọn thùng rác" }) }, "Dọn hết") }),
    items.length === 0
      ? h(EmptyState, { title: "Thùng rác trống.",
          text: "Mọi thứ mày xoá sẽ nằm ở đây " + TRASH_DAYS + " ngày trước khi mất hẳn." })
      : h("div", { className: "group" }, items.map(e => h("div", { className: "trash-item", key: e.id },
          h("div", { className: "trash-copy" },
            h("div", { className: "trash-name" }, e.label),
            h("div", { className: "trash-kind" }, KIND_LABEL[e.kind] + " · xoá " + dateDisplay(iso(new Date(e.deletedAt))))),
          h("button", { className: "btn sm", onClick: () => restore(e) }, "Khôi phục")))));
}

/* ===================== mount ===================== */
ReactDOM.createRoot(document.getElementById("root")).render(h(App));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
