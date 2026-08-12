/* Rootwork — app.js
   Chỉ còn giao diện. Mọi phép tính nằm ở domain.js, mọi thao tác lưu trữ
   nằm ở store.js. File này không được chứa công thức nào.

   Cây Objective → Key Result → Task là bản sắc, giữ nguyên.
   Tương tác ở tầng task mượn quy ước Reminders: ngày/giờ tách rời,
   nhập liền dòng, chạm mở chi tiết, vuốt để hoãn/xoá, xoá mềm 30 ngày. */
(function (global) {
  'use strict';

  var React = global.React;
  var ReactDOM = global.ReactDOM;
  var D = global.RootworkDomain;
  var S = global.RootworkStore;

  var useState = React.useState;
  var useEffect = React.useEffect;
  var useRef = React.useRef;
  var useMemo = React.useMemo;
  var useCallback = React.useCallback;
  var h = React.createElement;
  var Fragment = React.Fragment;

  var DOW = D.DOW;

  function deepClone(v) {
    if (typeof structuredClone === 'function') return structuredClone(v);
    return JSON.parse(JSON.stringify(v));
  }

  /* ===================== icon set =====================
     SVG stroke theo currentColor thay cho emoji. Emoji trên iOS render thành
     ảnh màu, phá bảng màu và không đổi màu theo trạng thái. */
  var PATHS = {
    calendar: ['M8 3v3', 'M16 3v3', 'M3.5 9.5h17', 'M6.5 5.5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3z'],
    clock: ['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z', 'M12 7.5v5l3.5 2'],
    flag: ['M6 21V4.5', 'M6 5.2h10.5l-2 3.4 2 3.4H6'],
    target: ['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z', 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z'],
    trash: ['M4.5 6.5h15', 'M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5', 'M6.5 6.5l1 12a2 2 0 0 0 2 1.9h5a2 2 0 0 0 2-1.9l1-12'],
    archive: ['M3.5 4.5h17v4h-17z', 'M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-10', 'M10 12.5h4'],
    restore: ['M4 11a8 8 0 1 1 2.5 5.8', 'M3.5 5.5v5.5h5.5'],
    chevron: ['M9 5.5l6.5 6.5L9 18.5'],
    back: ['M14.5 5.5L8 12l6.5 6.5'],
    arrow: ['M5 12h13', 'M12.5 6.5L18 12l-5.5 5.5'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
    close: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    undo: ['M9.5 6.5L4 12l5.5 5.5', 'M4 12h11a5 5 0 0 1 0 10h-2'],
    download: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M4.5 19.5h15'],
    upload: ['M12 15V4', 'M7.5 8.5L12 4l4.5 4.5', 'M4.5 19.5h15'],
    grid: ['M4 4.5h6.5v6.5H4z', 'M13.5 4.5H20v6.5h-6.5z', 'M4 13.5h6.5V20H4z', 'M13.5 13.5H20V20h-6.5z'],
    repeat: ['M4 9.5A4.5 4.5 0 0 1 8.5 5h11', 'M16 1.5L19.5 5 16 8.5', 'M20 14.5a4.5 4.5 0 0 1-4.5 4.5h-11', 'M8 22.5L4.5 19 8 15.5'],
    plus: ['M12 5v14', 'M5 12h14'],
    home: ['M3.5 10.5L12 3.8l8.5 6.7', 'M5.5 9.5v10h13v-10', 'M9.5 19.5v-6h5v6']
  };

  function Icon(props) {
    var d = PATHS[props.name] || [];
    return h('svg', {
      width: props.size || 20, height: props.size || 20, viewBox: '0 0 24 24',
      fill: 'none', className: props.className, style: props.style,
      stroke: 'currentColor', strokeWidth: props.width || 1.7,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': 'true', focusable: 'false'
    }, d.map(function (p, i) { return h('path', { key: i, d: p }); }));
  }

  /* ===================== shared UI ===================== */

  function Progress(props) {
    var v = D.clamp(Number(props.value) || 0, 0, 100);
    return h('div', { className: 'progress', 'aria-label': v + '%' },
      h('span', { style: { width: v + '%' } }));
  }

  function Check(props) {
    return h('button', {
      type: 'button', className: 'check' + (props.done ? ' done' : ''),
      onClick: function (e) { e.stopPropagation(); props.onClick(); },
      'aria-label': props.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành',
      'aria-pressed': props.done
    });
  }

  function SegmentBar(props) {
    var on = D.segments(props.percent);
    return h('div', { className: 'segment-bar', 'aria-hidden': 'true' },
      Array.from({ length: 4 }, function (_, i) {
        return h('span', { key: i, className: i < on ? 'on' : '' });
      }));
  }

  function Switch(props) {
    return h('button', {
      type: 'button', className: 'switch' + (props.on ? ' on' : ''),
      onClick: props.onChange, 'aria-pressed': props.on, 'aria-label': props.label
    });
  }

  function EditableText(props) {
    var st = useState(false), editing = st[0], setEditing = st[1];
    var dr = useState(props.value), draft = dr[0], setDraft = dr[1];
    useEffect(function () { if (!editing) setDraft(props.value); }, [props.value, editing]);

    function commit() {
      var next = draft.trim();
      if (next && next !== props.value) props.onSave(next); else setDraft(props.value);
      setEditing(false);
    }

    if (editing) {
      return h('input', {
        className: 'txt', autoFocus: true, value: draft,
        onChange: function (e) { setDraft(e.target.value); },
        onBlur: commit,
        onKeyDown: function (e) {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(props.value); setEditing(false); }
        }
      });
    }
    return h('button', {
      type: 'button', className: 'editable-line',
      onClick: function () { setEditing(true); }, title: 'Chạm để sửa'
    }, h('span', { className: 'editable-value' }, props.value));
  }

  function ScreenHeader(props) {
    return h('header', { className: 'screen-head' },
      h('div', { className: 'screen-head-left' },
        props.onBack && h('button', {
          className: 'back-btn', type: 'button', onClick: props.onBack, 'aria-label': 'Quay lại'
        }, h(Icon, { name: 'back', size: 22 })),
        h('div', { style: { minWidth: 0 } },
          h('h1', { className: 'screen-title' }, props.title),
          props.subtitle && h('div', { className: 'screen-sub' }, props.subtitle))),
      props.actions && h('div', { className: 'screen-actions' }, props.actions));
  }

  function EmptyState(props) {
    return h('div', { className: 'empty' },
      h('h3', null, props.title),
      props.text && h('p', null, props.text),
      props.action);
  }

  function Sheet(props) {
    useEffect(function () {
      function onKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); props.onClose(); }
      }
      global.addEventListener('keydown', onKey);
      return function () { global.removeEventListener('keydown', onKey); };
    }, [props.onClose]);

    return h('div', {
      className: 'scrim', role: 'presentation',
      onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose(); }
    }, h('section', {
      className: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': props.title
    },
      h('div', { className: 'sheet-grip', 'aria-hidden': 'true' }),
      h('div', { className: 'sheet-head' },
        h('button', {
          className: 'sheet-x', type: 'button', onClick: props.onClose, 'aria-label': 'Đóng'
        }, h(Icon, { name: 'close' })),
        h('h2', { className: 'sheet-title' }, props.title),
        props.headAction || h('span', { style: { width: 44, flex: 'none' } })),
      props.children));
  }

  /* Vuốt phải = hoãn +1 ngày · vuốt trái = xoá.
     Chỉ nhận cử chỉ ngang, nhường trục dọc cho cuộn trang.

     Vị trí giữ trong ref chứ không phải state: handler pointerup đọc closure
     của lần render gần nhất, nên vuốt nhanh có xác suất đọc giá trị cũ và
     nuốt mất cử chỉ đã đủ ngưỡng. State chỉ để vẽ. */
  var SWIPE_THRESHOLD = 76;

  function Swipe(props) {
    var s = useState(0), dx = s[0], setDx = s[1];
    var t = useState(false), settling = t[0], setSettling = t[1];
    var gesture = useRef(null);
    var offset = useRef(0);

    function move(x) {
      offset.current = x;
      setDx(x);
    }

    function down(e) {
      if (e.pointerType === 'mouse') return;
      gesture.current = { x: e.clientX, y: e.clientY, axis: null };
      setSettling(false);
    }

    function drag(e) {
      var g = gesture.current;
      if (!g) return;
      var mx = e.clientX - g.x;
      var my = e.clientY - g.y;
      if (!g.axis) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        g.axis = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      }
      if (g.axis !== 'x') return;
      move(D.clamp(mx, props.onLeft ? -140 : 0, props.onRight ? 140 : 0));
    }

    function up() {
      var g = gesture.current;
      var travelled = offset.current;
      gesture.current = null;
      setSettling(true);
      move(0);
      if (!g || g.axis !== 'x') return;
      if (travelled <= -SWIPE_THRESHOLD && props.onLeft) props.onLeft();
      else if (travelled >= SWIPE_THRESHOLD && props.onRight) props.onRight();
    }

    return h('div', { className: 'swipe' },
      dx !== 0 && h('div', { className: 'swipe-back', 'aria-hidden': 'true' },
        h('div', { className: 'swipe-act defer', style: { opacity: dx > 0 ? 1 : 0 } }, props.rightLabel || ''),
        h('div', { className: 'swipe-act del', style: { opacity: dx < 0 ? 1 : 0 } }, props.leftLabel || '')),
      h('div', {
        className: 'swipe-front' + (settling ? ' settling' : ''),
        style: { transform: 'translateX(' + dx + 'px)' },
        onPointerDown: down, onPointerMove: drag, onPointerUp: up, onPointerCancel: up
      }, props.children));
  }

  function RingProgress(props) {
    var v = D.clamp(Number(props.value) || 0, 0, 100);
    var dim = props.size || 86;
    var r = 31;
    var c = 2 * Math.PI * r;
    return h('div', { className: 'ring-wrap', style: { width: dim, height: dim } },
      h('svg', { viewBox: '0 0 76 76', width: dim, height: dim, 'aria-hidden': 'true' },
        h('circle', { className: 'ring-track', cx: 38, cy: 38, r: r, fill: 'none' }),
        h('circle', {
          className: 'ring-value', cx: 38, cy: 38, r: r, fill: 'none',
          strokeDasharray: c, strokeDashoffset: c * (1 - v / 100),
          transform: 'rotate(-90 38 38)'
        })),
      h('strong', null, v + '%'));
  }

  function TrendSpark(props) {
    var list = Array.isArray(props.values) && props.values.length ? props.values : [0];
    var w = 260, hgt = 74, padding = 6;
    var pts = list.map(function (v, i) {
      var x = list.length === 1 ? w / 2 : padding + i * (w - padding * 2) / (list.length - 1);
      var y = hgt - padding - D.clamp(v, 0, 100) / 100 * (hgt - padding * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return h('svg', {
      className: 'trend-spark', viewBox: '0 0 260 74',
      preserveAspectRatio: 'none', 'aria-hidden': 'true'
    },
      h('line', { x1: 0, y1: 68, x2: 260, y2: 68, className: 'spark-base' }),
      h('polyline', { points: pts, fill: 'none', className: 'spark-line' }));
  }

  function MiniStat(props) {
    return h('div', { className: 'mini-stat' },
      h('strong', null, props.value),
      h('span', null, props.label),
      props.sub && h('small', null, props.sub));
  }

  var NAV_ITEMS = [
    { id: 'home', label: 'Tổng quan', icon: 'home' },
    { id: 'today', label: 'Hôm nay', icon: 'calendar' },
    { id: 'targets', label: 'Mục tiêu', icon: 'target' },
    { id: 'routines', label: 'Thói quen', icon: 'repeat' },
    { id: 'week', label: 'Cả tuần', icon: 'grid' }
  ];

  function BottomNav(props) {
    return h('nav', { className: 'bottom-nav', 'aria-label': 'Điều hướng chính' },
      NAV_ITEMS.map(function (item) {
        return h('button', {
          key: item.id, type: 'button',
          className: 'bottom-nav-item' + (props.view === item.id ? ' on' : ''),
          onClick: function () { props.setView(item.id); },
          'aria-current': props.view === item.id ? 'page' : undefined
        }, h(Icon, { name: item.icon, size: 20, width: 1.8 }), h('span', null, item.label));
      }));
  }

  /* ===================== brand ===================== */

  /* Mark nằm trong khung xanh brand, bo 18px — cùng ngữ pháp với
     .rootflow-mark-wrap. Đây là tín hiệu family mạnh nhất trong app: cùng
     khung, cùng nền, cùng tỉ lệ; chỉ khác hình bên trong. */
  function BrandHeader(props) {
    return h('header', { className: 'brand-app-head' },
      h('div', { className: 'brand-app-lockup' },
        h('span', { className: 'brand-mark-wrap' },
          h('img', { className: 'brand-glyph', src: 'brand/rootwork-mark.svg', alt: '' })),
        h('div', { className: 'brand-app-copy' },
          h('div', { className: 'brand-app-wordmark' },
            h('span', null, 'ROOT'), h('em', null, 'WORK')),
          h('div', { className: 'brand-app-tagline' }, 'BUILD STRONG FOUNDATIONS.'))),
      props.actions);
  }

  /* ===================== app ===================== */

  function App() {
    var d0 = useState(null), data = d0[0], setData = d0[1];
    var v0 = useState('home'), view = v0[0], setView = v0[1];
    var w0 = useState(0), weekOffset = w0[0], setWeekOffset = w0[1];
    var m0 = useState(false), menuOpen = m0[0], setMenuOpen = m0[1];
    var s0 = useState(null), sheet = s0[0], setSheet = s0[1];
    var e0 = useState(''), storageError = e0[0], setStorageError = e0[1];
    var b0 = useState(false), saveBlocked = b0[0], setSaveBlocked = b0[1];
    var u0 = useState(null), undo = u0[0], setUndo = u0[1];

    var loaded = useRef(false);
    var undoTimer = useRef(null);
    var dataRef = useRef(null);
    dataRef.current = data;

    useEffect(function () {
      try {
        if (!S.writable()) {
          setStorageError('Trình duyệt đang chặn bộ nhớ cục bộ. Thay đổi trong phiên này sẽ mất khi đóng app.');
          setSaveBlocked(true);
          setData(S.empty());
        } else {
          setData(S.load() || S.empty());
          /* Không có dòng này, iOS có quyền dọn sạch localStorage sau vài ngày
             không mở app. */
          if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().catch(function () {});
          }
        }
      } catch (e) {
        setStorageError('Không đọc được dữ liệu đã lưu. Rootwork đang chạy tạm và chưa ghi đè kho cũ.');
        setSaveBlocked(true);
        setData(S.empty());
      } finally {
        loaded.current = true;
      }
    }, []);

    useEffect(function () {
      if (!loaded.current || !data || saveBlocked) return undefined;
      var t = setTimeout(function () {
        try {
          S.save(data);
          setStorageError(S.nearLimit()
            ? 'Kho dữ liệu đã vượt 3 MB. Xuất bản sao lưu và dọn thùng rác.' : '');
        } catch (e) {
          setStorageError('Không ghi được thay đổi vào thiết bị này. Dữ liệu mới chỉ tồn tại trong phiên đang mở.');
          setSaveBlocked(true);
        }
      }, 80);
      return function () { clearTimeout(t); };
    }, [data, saveBlocked]);

    useEffect(function () {
      return function () { if (undoTimer.current) clearTimeout(undoTimer.current); };
    }, []);

    useEffect(function () {
      function onKey(e) {
        var t = e.target;
        if (!t || sheet || e.ctrlKey || e.metaKey || e.altKey || typeof e.key !== 'string') return;
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
        if (e.key === '1') { setView('targets'); e.preventDefault(); }
        if (e.key === '2') { setView('today'); e.preventDefault(); }
        if (e.key === '3') { setView('routines'); e.preventDefault(); }
        if (e.key === '4') { setView('week'); e.preventDefault(); }
        if (e.key.toLowerCase() === 'n') { setSheet({ mode: 'new', presetDate: D.today() }); e.preventDefault(); }
        if (e.key === 'Escape' && view !== 'home') setView('home');
      }
      global.addEventListener('keydown', onKey);
      return function () { global.removeEventListener('keydown', onKey); };
    }, [view, sheet]);

    function showUndo(label, snapshot) {
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setUndo({ label: label, snapshot: snapshot });
      undoTimer.current = setTimeout(function () { setUndo(null); }, 6000);
    }

    /* Ảnh chụp hoàn tác lấy NGOÀI updater — hàm truyền vào setState phải thuần
       khiết, React có quyền gọi lại nhiều lần. */
    var mutate = useCallback(function (change, options) {
      if (options && options.undoLabel && dataRef.current) {
        showUndo(options.undoLabel, deepClone(dataRef.current));
      }
      setData(function (prev) {
        var next = deepClone(prev);
        change(next);
        next.schemaVersion = S.SCHEMA;
        next.meta = Object.assign({}, next.meta || {}, { updatedAt: S.now() });
        return next;
      });
    }, []);

    function undoLast() {
      if (!undo) return;
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setData(deepClone(undo.snapshot));
      setUndo(null);
    }

    function onExport() {
      if (!data) return;
      S.exportBackup(data);
      setMenuOpen(false);
    }

    function onImport(file) {
      S.importBackup(file, function (err, next) {
        if (err) { setStorageError(err); setMenuOpen(false); return; }
        showUndo('Đã nạp bản sao lưu', deepClone(dataRef.current));
        setData(next);
        setStorageError('');
        setMenuOpen(false);
      });
    }

    if (!data) return h('div', { className: 'loading' }, 'Đang mở Rootwork…');

    function openTask(task) { setSheet({ mode: 'edit', task: task }); }
    function openNew(preset) {
      setSheet({ mode: 'new', presetDate: preset === undefined ? D.today() : preset });
    }

    var shared = { data: data, mutate: mutate, openTask: openTask, openNew: openNew };
    var content;
    if (view === 'targets') content = h(TargetsView, shared);
    else if (view === 'today') content = h(TodayView, shared);
    else if (view === 'week') content = h(WeekView, Object.assign({}, shared, {
      weekOffset: weekOffset, setWeekOffset: setWeekOffset
    }));
    else if (view === 'routines') content = h(RoutinesView, shared);
    else if (view === 'trash') content = h(TrashView, Object.assign({}, shared, {
      onBack: function () { setView('home'); }
    }));
    else content = h(HomeView, Object.assign({}, shared, {
      storageError: storageError, setView: setView,
      menuOpen: menuOpen, setMenuOpen: setMenuOpen,
      onExport: onExport, onImport: onImport
    }));

    return h(Fragment, null,
      h('main', { className: 'app-shell' },
        view !== 'home' && storageError && h('div', { className: 'notice danger' },
          h('div', null, h('strong', null, 'Dữ liệu chưa được lưu'), h('p', null, storageError))),
        content,
        h('footer', { className: 'app-copyright' },
          h('span', null, '© ' + new Date().getFullYear() + ' @derekdaydoi'),
          h('span', { className: 'copyright-sep', 'aria-hidden': 'true' }, '·'),
          h('span', null, 'Rootwork'))),
      view !== 'trash' && h(BottomNav, { view: view, setView: setView }),
      h('button', {
        className: 'fab', type: 'button', onClick: function () { openNew(); },
        title: 'Thêm việc (phím N)', 'aria-label': 'Thêm việc'
      }),
      sheet && h(TaskSheet, {
        data: data, mutate: mutate, spec: sheet, onClose: function () { setSheet(null); }
      }),
      undo && h('div', { className: 'toast', role: 'status' },
        h('span', null, undo.label),
        h('button', { type: 'button', onClick: undoLast }, 'Hoàn tác')));
  }

  /* ===================== home ===================== */

  function HomeView(props) {
    var data = props.data;
    var setView = props.setView;

    var monday = D.mondayOf(D.today());
    var today = D.today();

    var view = useMemo(function () {
      var flat = D.flatten(data);
      var todayTasks = D.sortDay(flat.filter(function (t) { return t.date === today; }));
      var doneCount = todayTasks.filter(function (t) { return t.done; }).length;
      var todayPercent = D.donePercent(todayTasks);
      var metrics = D.weekMetrics(data, monday);
      return {
        todayTasks: todayTasks,
        done: doneCount,
        pending: todayTasks.length - doneCount,
        percent: todayPercent,
        metrics: metrics,
        rhythm: D.rhythmScore(metrics),
        next: D.nextTask(data),
        featured: D.featuredObjective(data),
        attention: D.attentionItems(data),
        routineHits: (data.routines || []).filter(function (r) { return r.log[today]; }).length,
        bestStreak: (data.routines || []).reduce(function (m, r) {
          return Math.max(m, D.weekStreak(r));
        }, 0)
      };
    }, [data, monday, today]);

    var menu = h('div', { className: 'menu-wrap' },
      h('button', {
        type: 'button', className: 'icon-btn soft',
        onClick: function () { props.setMenuOpen(!props.menuOpen); },
        'aria-label': 'Mở menu', 'aria-expanded': props.menuOpen
      }, h(Icon, { name: 'menu' })),
      props.menuOpen && h(Fragment, null,
        h('div', { className: 'backdrop-lite', onClick: function () { props.setMenuOpen(false); } }),
        h('div', { className: 'menu-card' },
          h('button', {
            type: 'button',
            onClick: function () { props.setMenuOpen(false); setView('trash'); }
          }, h(Icon, { name: 'trash' }), 'Đã xoá gần đây',
            data.trash.length ? ' · ' + data.trash.length : ''),
          h('div', { className: 'menu-sep' }),
          h('button', { type: 'button', onClick: props.onExport },
            h(Icon, { name: 'download' }), 'Xuất bản sao lưu'),
          h('label', null, h(Icon, { name: 'upload' }), 'Nạp bản sao lưu',
            h('input', {
              type: 'file', accept: 'application/json,.json', className: 'sr-only',
              onChange: function (e) {
                props.onImport(e.target.files && e.target.files[0]);
                e.target.value = '';
              }
            })))));

    return h(Fragment, null,
      h(BrandHeader, { actions: menu }),

      h('div', { className: 'home-context' },
        h('span', null, D.fmtToday()),
        h('strong', null, view.percent + '% hôm nay')),

      props.storageError && h('div', { className: 'notice danger' },
        h('div', null, h('strong', null, 'Dữ liệu chưa được lưu'), h('p', null, props.storageError))),

      h('section', { className: 'dash-card progress-card' },
        h('div', { className: 'section-kicker' }, 'Tiến độ hôm nay'),
        h('div', { className: 'progress-hero' },
          h(RingProgress, { value: view.percent }),
          h('div', { className: 'progress-copy' },
            h('div', { className: 'progress-fraction' }, view.done + ' / ' + view.todayTasks.length),
            h('div', { className: 'progress-label' }, 'việc hoàn thành'),
            h('p', null, view.pending
              ? 'Còn ' + view.pending + ' việc để khép ngày theo kế hoạch.'
              : 'Không còn việc nào đang chờ hôm nay.'))),
        view.next && h('div', { className: 'next-action' },
          h('div', null,
            h('span', null, 'Việc tiếp theo'),
            h('strong', null, view.next.time ? view.next.time + ' · ' + view.next.title : view.next.title),
            h('small', null, view.next.source + (view.next.krTitle ? ' · ' + view.next.krTitle : ''))),
          h('button', {
            className: 'btn primary sm', onClick: function () { setView('today'); }
          }, 'Bắt đầu'))),

      view.featured && h('section', {
        className: 'dash-card objective-pulse', role: 'button', tabIndex: 0,
        onClick: function () { setView('targets'); }
      },
        h('div', { className: 'card-headline' },
          h('div', null,
            h('div', { className: 'section-kicker' }, 'Mục tiêu gần hạn'),
            h('h2', null, view.featured.title)),
          h('strong', { className: 'accent-number' }, D.objectivePercent(view.featured) + '%')),
        h(Progress, { value: D.objectivePercent(view.featured) }),
        h('div', { className: 'objective-pulse-meta' },
          h('span', null, view.featured.deadline
            ? 'Hạn ' + D.fmtDate(view.featured.deadline) : 'Chưa đặt hạn'),
          h('span', null, (view.featured.krs || []).length + ' key result'))),

      h('section', { className: 'dash-card' },
        h('div', { className: 'section-kicker' }, 'Tuần này'),
        h('div', { className: 'week-stat-grid' },
          h(MiniStat, { value: view.metrics.done + '/' + view.metrics.total, label: 'Hoàn thành', sub: 'việc' }),
          h(MiniStat, { value: view.routineHits + '/' + data.routines.length, label: 'Thói quen', sub: 'hôm nay' }),
          h(MiniStat, { value: view.metrics.highDone + '/' + view.metrics.high.length, label: 'Tập trung', sub: 'ưu tiên cao' }),
          h(MiniStat, { value: view.rhythm, label: 'Điểm nhịp', sub: '0–100' })),
        h('button', {
          className: 'text-action', onClick: function () { setView('week'); }
        }, 'Xem cả tuần', h(Icon, { name: 'arrow', size: 17 }))),

      h('section', { className: 'dash-card attention-card' },
        h('div', { className: 'card-headline' },
          h('div', null,
            h('div', { className: 'section-kicker' }, 'Cần chú ý'),
            h('h2', null, view.attention.length
              ? view.attention.length + ' điểm cần quyết định' : 'Mọi thứ đang gọn')),
          view.bestStreak > 0 && h('span', { className: 'streak-badge' }, view.bestStreak + ' tuần streak')),
        view.attention.length === 0
          ? h('p', { className: 'muted-copy' }, 'Không có overdue, backlog hoặc deadline gần cần xử lý.')
          : h('div', { className: 'attention-list' }, view.attention.slice(0, 3).map(function (a, i) {
              return h('button', {
                key: i, className: 'attention-row ' + a.tone,
                onClick: function () { setView(a.view); }
              },
                h('span', { className: 'attention-dot' }),
                h('span', { className: 'attention-copy' },
                  h('strong', null, a.title), h('small', null, a.text)),
                h(Icon, { name: 'chevron', size: 17 }));
            }))));
  }

  /* ===================== task row ===================== */

  function TaskRow(props) {
    var task = props.task;
    var mutate = props.mutate;
    var late = task.date && !task.done && task.date < D.today();

    function toggle() {
      mutate(function (d) {
        var r = D.findTask(d, task);
        if (r) r.done = !r.done;
      });
    }

    function defer() {
      mutate(function (d) {
        var r = D.findTask(d, task);
        if (r) r.date = D.addDays(r.date || D.today(), 1);
      }, { undoLabel: 'Đã hoãn “' + task.title + '”' });
    }

    /* Thùng rác chỉ nhận bản ghi sạch. Trước đây nó nhận nguyên task đã
       flatten, và đường khôi phục đẩy cả loose/source/krTitle/objId/krId
       ngược vào cây. */
    function remove() {
      mutate(function (d) {
        var dest = D.destOf(task);
        D.detachTask(d, task);
        d.trash.push({
          id: S.uid(), deletedAt: S.now(), kind: 'task',
          label: task.title, dest: dest, payload: D.bare(task)
        });
      }, { undoLabel: 'Đã xoá “' + task.title + '”' });
    }

    return h(Swipe, {
      onLeft: remove, onRight: defer, leftLabel: 'Xoá', rightLabel: 'Hoãn 1 ngày'
    }, h('div', {
      className: 'task', onClick: props.onOpen, role: 'button', tabIndex: 0,
      onKeyDown: function (e) { if (e.key === 'Enter') props.onOpen(); }
    },
      h('span', {
        className: 'bar-hi' + (task.priority === 'high' && !task.done ? '' : ' off'),
        'aria-hidden': 'true'
      }),
      h(Check, { done: task.done, onClick: toggle }),
      h('div', { className: 'task-body' },
        h('div', {
          className: 'task-name' + (task.done ? ' done' : task.priority === 'high' ? ' hi' : '')
        }, task.title),
        h('div', { className: 'task-sub' },
          task.time && h('span', { className: 'time-badge' }, task.time),
          h('span', { className: late ? 'late' : '' }, D.fmtDate(task.date)),
          props.showSource && h('span', null,
            task.source + (task.krTitle ? ' · ' + task.krTitle : '')),
          task.note && h('span', null, 'có ghi chú')))));
  }

  /* ===================== task sheet =====================
     Khối Ngày / Giờ tách rời là thứ thay cho field `type` chết trong v2.
     Ô chọn ngày và các chip nằm ở hàng riêng bên dưới, không chen ngang —
     chen ngang là lý do "Hôm nay" bị bẻ thành hai dòng. */

  function TaskSheet(props) {
    var data = props.data;
    var spec = props.spec;
    var editing = spec.mode === 'edit';
    var src = editing ? spec.task : null;

    var a = useState(src ? src.title : ''), title = a[0], setTitle = a[1];
    var b = useState(src ? src.note : ''), note = b[0], setNote = b[1];
    var c = useState(src ? src.priority : 'low'), priority = c[0], setPriority = c[1];
    var e = useState(src ? src.date : (D.isIsoDate(spec.presetDate) ? spec.presetDate : null));
    var date = e[0], setDate = e[1];
    var f = useState(src ? src.time : null), time = f[0], setTime = f[1];

    var dests = [{ id: 'loose', label: 'Phát sinh — không thuộc mục tiêu' }];
    data.objectives.filter(function (o) { return !o.archived; }).forEach(function (o) {
      (o.krs || []).forEach(function (kr) {
        dests.push({ id: o.id + '::' + kr.id, label: o.title + ' · ' + kr.title });
      });
    });

    /* Mặc định "Phát sinh": lúc ghi vội không ai muốn quyết định việc này thuộc
       mục tiêu nào. Phân loại là việc làm sau. */
    var g = useState(editing ? D.destOf(src) : 'loose'), dest = g[0], setDest = g[1];

    var today = D.today();
    var tomorrow = D.addDays(today, 1);

    function commit() {
      var name = title.trim();
      if (!name) return;
      var payload = {
        title: name, note: note.trim(), priority: priority,
        date: date, time: date ? time : null
      };
      props.mutate(function (draft) {
        if (editing) {
          var r = D.findTask(draft, src);
          if (r && dest === D.destOf(src)) { Object.assign(r, payload); return; }
          var moved = Object.assign({ id: src.id, done: r ? r.done : false }, payload);
          D.detachTask(draft, src);
          D.attachTask(draft, dest, moved);
        } else {
          D.attachTask(draft, dest, Object.assign({ id: S.uid(), done: false }, payload));
        }
      });
      props.onClose();
    }

    function remove() {
      props.mutate(function (draft) {
        var dest0 = D.destOf(src);
        D.detachTask(draft, src);
        draft.trash.push({
          id: S.uid(), deletedAt: S.now(), kind: 'task',
          label: src.title, dest: dest0, payload: D.bare(src)
        });
      }, { undoLabel: 'Đã xoá “' + src.title + '”' });
      props.onClose();
    }

    return h(Sheet, {
      title: editing ? 'Chi tiết việc' : 'Việc mới',
      onClose: props.onClose,
      headAction: h('button', {
        className: 'sheet-done', onClick: commit, disabled: !title.trim()
      }, editing ? 'Xong' : 'Thêm')
    },
      h('div', { className: 'group' },
        h('input', {
          className: 'sheet-title-input', autoFocus: !editing, value: title,
          placeholder: 'Việc cần làm',
          onChange: function (ev) { setTitle(ev.target.value); },
          onKeyDown: function (ev) { if (ev.key === 'Enter') commit(); }
        }),
        h('textarea', {
          className: 'sheet-note', value: note, placeholder: 'Ghi chú',
          onChange: function (ev) { setNote(ev.target.value); }
        })),

      h('div', { className: 'group-label' }, 'Ngày & giờ'),
      h('div', { className: 'group' },
        h('div', { className: 'row' },
          h('span', { className: 'row-icon' }, h(Icon, { name: 'calendar', size: 18 })),
          h('div', { className: 'row-main' },
            h('div', { className: 'row-label' }, 'Ngày'),
            h('div', { className: 'row-value' }, date ? D.fmtDateFull(date) : 'Chưa xếp lịch')),
          h(Switch, {
            on: Boolean(date), label: 'Đặt ngày',
            onChange: function () {
              if (date) { setDate(null); setTime(null); } else setDate(today);
            }
          })),
        date && h('div', { className: 'row-sub' },
          h('input', {
            className: 'field', type: 'date', value: date, 'aria-label': 'Chọn ngày',
            onChange: function (ev) {
              setDate(D.isIsoDate(ev.target.value) ? ev.target.value : null);
            }
          }),
          h('div', { className: 'chip-strip' },
            h('button', {
              className: 'chip' + (date === today ? ' on' : ''),
              onClick: function () { setDate(today); }
            }, 'Hôm nay'),
            h('button', {
              className: 'chip' + (date === tomorrow ? ' on' : ''),
              onClick: function () { setDate(tomorrow); }
            }, 'Ngày mai'),
            h('button', {
              className: 'chip',
              onClick: function () { setDate(D.addDays(today, 7)); }
            }, 'Tuần sau'))),
        h('div', { className: 'row' },
          h('span', { className: 'row-icon' }, h(Icon, { name: 'clock', size: 18 })),
          h('div', { className: 'row-main' },
            h('div', { className: 'row-label' }, 'Giờ cố định'),
            h('div', { className: 'row-value' }, time ? 'Bắt đầu lúc ' + time : 'Tự xếp trong ngày')),
          h(Switch, {
            on: Boolean(time), label: 'Đặt giờ',
            onChange: function () {
              if (time) setTime(null);
              else { if (!date) setDate(today); setTime('09:00'); }
            }
          })),
        time && h('div', { className: 'row-sub' },
          h('input', {
            className: 'field', type: 'time', value: time, 'aria-label': 'Chọn giờ',
            onChange: function (ev) {
              setTime(D.isTime(ev.target.value) ? ev.target.value : null);
            }
          }))),

      h('div', { className: 'group-label' }, 'Phân loại'),
      h('div', { className: 'group' },
        h('div', { className: 'row' },
          h('span', { className: 'row-icon' }, h(Icon, { name: 'flag', size: 18 })),
          h('div', { className: 'row-main' },
            h('div', { className: 'row-label' }, 'Ưu tiên cao'),
            h('div', { className: 'row-value' },
              priority === 'high' ? 'Lên đầu danh sách trong ngày' : 'Mức thường')),
          h(Switch, {
            on: priority === 'high', label: 'Ưu tiên cao',
            onChange: function () { setPriority(priority === 'high' ? 'low' : 'high'); }
          })),
        h('div', { className: 'row' },
          h('span', { className: 'row-icon' }, h(Icon, { name: 'target', size: 18 })),
          h('div', { className: 'row-main' },
            h('div', { className: 'row-label' }, 'Thuộc Key Result'))),
        h('div', { className: 'row-sub' },
          h('select', {
            className: 'field', value: dest, 'aria-label': 'Thuộc Key Result',
            onChange: function (ev) { setDest(ev.target.value); }
          }, dests.map(function (x) {
            return h('option', { key: x.id, value: x.id }, x.label);
          })))),

      editing && h('button', { className: 'btn danger block', onClick: remove },
        h(Icon, { name: 'trash', size: 18 }), 'Xoá việc này'));
  }

  /* ===================== today ===================== */

  function TodayView(props) {
    var data = props.data;
    var today = D.today();
    var monday = D.mondayOf(today);
    var dates = D.weekDates(monday);
    var p0 = useState(today), picked = p0[0], setPicked = p0[1];

    var tasks = D.sortDay(D.flatten(data).filter(function (t) { return t.date === picked; }));
    var fixed = tasks.filter(function (t) { return t.time; });
    var flexible = tasks.filter(function (t) { return !t.time; });
    var done = tasks.filter(function (t) { return t.done; }).length;
    var overdue = picked === today ? D.overdue(data) : [];
    var future = picked > today;

    function toggleRoutine(id) {
      if (future) return;
      props.mutate(function (d) {
        var r = d.routines.find(function (i) { return i.id === id; });
        if (!r) return;
        if (r.log[picked]) delete r.log[picked]; else r.log[picked] = true;
      });
    }

    function section(label, list, emptyText) {
      return h(Fragment, null,
        h('div', { className: 'group-label' }, label),
        h('div', { className: 'group day-task-group' }, list.length
          ? list.map(function (t) {
              return h(TaskRow, {
                key: (t.loose ? 'l' : 't') + t.id, task: t, mutate: props.mutate,
                showSource: true, onOpen: function () { props.openTask(t); }
              });
            })
          : h('div', { className: 'row quiet-row' },
              h('div', { className: 'row-main' },
                h('div', { className: 'row-value' }, emptyText)))));
    }

    return h(Fragment, null,
      h(ScreenHeader, {
        title: picked === today ? 'Hôm nay' : D.fmtDateFull(picked),
        subtitle: done + ' / ' + tasks.length + ' việc đã xong',
        actions: h('button', {
          className: 'icon-btn soft', 'aria-label': 'Thêm việc',
          onClick: function () { props.openNew(picked); }
        }, h(Icon, { name: 'plus' }))
      }),
      h('nav', { className: 'day-strip compact', 'aria-label': 'Chọn ngày trong tuần' },
        DOW.map(function (day, i) {
          var date = dates[i];
          return h('button', {
            key: date, type: 'button',
            className: 'day-pick' + (date === picked ? ' on' : '') + (date === today ? ' today' : ''),
            onClick: function () { setPicked(date); }, 'aria-pressed': date === picked
          },
            h('span', { className: 'day-pick-dow' }, day),
            h('span', { className: 'day-pick-num' }, D.parseYmd(date).getDate()));
        })),
      section('Việc có giờ cố định', fixed, 'Không có lịch cố định.'),
      section('Việc linh hoạt', flexible, 'Không có việc linh hoạt trong ngày này.'),
      overdue.length > 0 && h(Fragment, null,
        h('div', { className: 'group-label danger-label' }, 'Quá hạn · ' + overdue.length),
        h('div', { className: 'group overdue-group' }, overdue.map(function (t) {
          return h(TaskRow, {
            key: 'o' + t.id, task: t, mutate: props.mutate, showSource: true,
            onOpen: function () { props.openTask(t); }
          });
        }))),
      data.routines.length > 0 && h(Fragment, null,
        h('div', { className: 'group-label' },
          'Thói quen ' + (picked === today ? 'hôm nay' : D.fmtDate(picked))),
        h('section', { className: 'panel habit-check-panel' },
          h('div', { className: 'routine-pills' }, data.routines.map(function (r) {
            var on = Boolean(r.log[picked]);
            return h('button', {
              key: r.id, type: 'button', disabled: future,
              className: 'routine-pill' + (on ? ' on' : '') + (future ? ' future' : ''),
              onClick: function () { toggleRoutine(r.id); }, 'aria-pressed': on
            }, h('i', null, on && h(Icon, { name: 'check', size: 12, width: 3 })), r.name);
          })))));
  }

  /* ===================== targets ===================== */

  var FILTERS = [
    ['all', 'Tất cả'], ['active', 'Đang thực hiện'],
    ['done', 'Đã đạt'], ['archived', 'Lưu trữ']
  ];

  function TargetsView(props) {
    var data = props.data;
    var a0 = useState(false), adding = a0[0], setAdding = a0[1];
    var t0 = useState(''), title = t0[0], setTitle = t0[1];
    var d0 = useState(''), deadline = d0[0], setDeadline = d0[1];
    var f0 = useState('all'), filter = f0[0], setFilter = f0[1];
    var o0 = useState(function () {
      var m = {};
      data.objectives.filter(function (o) { return !o.archived; })
        .forEach(function (o) { m[o.id] = true; });
      return m;
    });
    var openMap = o0[0], setOpenMap = o0[1];

    var visible = data.objectives.filter(function (o) {
      var pct = D.objectivePercent(o);
      if (filter === 'active') return !o.archived && pct < 100;
      if (filter === 'done') return !o.archived && pct >= 100;
      if (filter === 'archived') return o.archived;
      return !o.archived;
    });

    function add() {
      var t = title.trim();
      if (!t) return;
      props.mutate(function (d) {
        d.objectives.push({
          id: S.uid(), title: t,
          deadline: D.isIsoDate(deadline) ? deadline : null,
          archived: false, krs: []
        });
      });
      setTitle(''); setDeadline(''); setAdding(false);
    }

    return h(Fragment, null,
      h(ScreenHeader, {
        title: 'Mục tiêu',
        subtitle: data.objectives.filter(function (o) { return !o.archived; }).length +
          ' objective đang theo dõi',
        actions: h('button', {
          className: 'icon-btn soft', 'aria-label': 'Objective mới',
          onClick: function () { setAdding(true); }
        }, h(Icon, { name: 'plus' }))
      }),
      h('div', { className: 'filter-tabs' }, FILTERS.map(function (pair) {
        return h('button', {
          key: pair[0], className: 'filter-tab' + (filter === pair[0] ? ' on' : ''),
          onClick: function () { setFilter(pair[0]); }
        }, pair[1]);
      })),
      adding && h('div', { className: 'panel add-objective-panel' },
        h('input', {
          className: 'txt', autoFocus: true, placeholder: 'Tên objective', value: title,
          onChange: function (e) { setTitle(e.target.value); },
          onKeyDown: function (e) {
            if (e.key === 'Enter') add();
            if (e.key === 'Escape') setAdding(false);
          }
        }),
        h('div', { className: 'inline wrap', style: { marginTop: 10 } },
          h('input', {
            className: 'txt grow', type: 'date', value: deadline, 'aria-label': 'Hạn',
            onChange: function (e) { setDeadline(e.target.value); }
          }),
          h('button', { className: 'btn primary', onClick: add }, 'Tạo objective'),
          h('button', {
            className: 'btn ghost', onClick: function () { setAdding(false); }
          }, 'Huỷ'))),
      visible.length === 0 && !adding && h(EmptyState, {
        title: filter === 'done' ? 'Chưa có objective đạt 100%.' : 'Chưa có objective ở nhóm này.',
        text: filter === 'all' || filter === 'active'
          ? 'Tạo Objective, đặt Key Result đo được, rồi mới sinh task.' : ''
      }),
      h('div', { className: 'objective-stack' }, visible.map(function (o) {
        return h(ObjectiveCard, {
          key: o.id, objective: o, mutate: props.mutate, openTask: props.openTask,
          open: Boolean(openMap[o.id]),
          setOpen: function () {
            setOpenMap(function (p) {
              var next = Object.assign({}, p);
              next[o.id] = !p[o.id];
              return next;
            });
          }
        });
      })));
  }

  function ObjectiveCard(props) {
    var objective = props.objective;
    var percent = D.objectivePercent(objective);
    var due = D.deadlineLabel(objective.deadline);

    function patch(fn) {
      props.mutate(function (d) {
        fn(d.objectives.find(function (i) { return i.id === objective.id; }));
      });
    }

    return h('article', { className: 'objective' },
      h('div', { className: 'objective-head' },
        h('button', {
          className: 'caret' + (props.open ? ' open' : ''), onClick: props.setOpen,
          'aria-expanded': props.open, 'aria-label': props.open ? 'Thu gọn' : 'Mở rộng'
        }, h(Icon, { name: 'chevron', size: 16, width: 2 })),
        h('div', { className: 'objective-title-line' },
          h(EditableText, {
            value: objective.title,
            onSave: function (v) { patch(function (o) { o.title = v; }); }
          }),
          h('div', { className: 'objective-meta' },
            h('span', { className: 'due ' + due.tone }, due.text),
            h('span', null, (objective.krs || []).length + ' key result'))),
        h('div', { className: 'objective-actions' },
          h('span', { className: 'percent' }, percent + '%'),
          h('button', {
            className: 'row-del plain', type: 'button',
            title: objective.archived ? 'Khôi phục' : 'Lưu trữ',
            'aria-label': objective.archived ? 'Khôi phục' : 'Lưu trữ',
            onClick: function () { patch(function (o) { o.archived = !o.archived; }); }
          }, h(Icon, { name: objective.archived ? 'restore' : 'archive', size: 18 })),
          h('button', {
            className: 'row-del', type: 'button', title: 'Xoá objective',
            'aria-label': 'Xoá objective',
            onClick: function () {
              props.mutate(function (d) {
                var gone = d.objectives.find(function (i) { return i.id === objective.id; });
                d.objectives = d.objectives.filter(function (i) { return i.id !== objective.id; });
                d.trash.push({
                  id: S.uid(), deletedAt: S.now(), kind: 'objective',
                  label: gone.title, payload: deepClone(gone)
                });
              }, { undoLabel: 'Đã xoá objective' });
            }
          }, h(Icon, { name: 'trash', size: 18 })))),
      h(Progress, { value: percent }),
      props.open && h('div', { className: 'objective-body' },
        h('div', { className: 'inline wrap', style: { marginBottom: 16 } },
          h('span', {
            style: { color: 'var(--muted)', fontSize: 'var(--t-sm)' }
          }, 'Hạn hoàn thành'),
          h('input', {
            className: 'txt', type: 'date', value: objective.deadline || '',
            style: { width: 'auto' }, 'aria-label': 'Hạn của objective',
            onChange: function (e) {
              patch(function (o) {
                o.deadline = D.isIsoDate(e.target.value) ? e.target.value : null;
              });
            }
          })),
        (objective.krs || []).map(function (kr) {
          return h(KrBlock, {
            key: kr.id, objective: objective, kr: kr,
            mutate: props.mutate, openTask: props.openTask
          });
        }),
        h(AddKr, { objective: objective, mutate: props.mutate })));
  }

  function KrBlock(props) {
    var objective = props.objective;
    var kr = props.kr;
    var percent = D.krPercent(kr);
    var m = kr.metric;

    function patch(fn) {
      props.mutate(function (d) {
        fn(d.objectives.find(function (i) { return i.id === objective.id; })
          .krs.find(function (i) { return i.id === kr.id; }));
      });
    }

    var tasks = D.sortDay((kr.tasks || []).map(function (t) {
      return Object.assign({}, t, {
        loose: false, objId: objective.id, krId: kr.id,
        source: objective.title, krTitle: kr.title
      });
    }));

    return h('section', { className: 'kr' },
      h('div', { className: 'kr-head' },
        h('span', { className: 'kr-dot' }),
        h('div', { className: 'kr-title' },
          h(EditableText, {
            value: kr.title, onSave: function (v) { patch(function (k) { k.title = v; }); }
          })),
        h('span', { className: 'kr-pct' }, percent + '%'),
        h('button', {
          className: 'row-del', type: 'button', title: 'Xoá Key Result',
          'aria-label': 'Xoá Key Result',
          onClick: function () {
            props.mutate(function (d) {
              var o = d.objectives.find(function (i) { return i.id === objective.id; });
              var gone = o.krs.find(function (i) { return i.id === kr.id; });
              o.krs = o.krs.filter(function (i) { return i.id !== kr.id; });
              d.trash.push({
                id: S.uid(), deletedAt: S.now(), kind: 'kr',
                label: gone.title, payload: deepClone(gone), objId: objective.id
              });
            }, { undoLabel: 'Đã xoá Key Result' });
          }
        }, h(Icon, { name: 'trash', size: 18 }))),

      /* Key Result phải đo được bằng con số. Không có chỉ số thì đây chỉ là một
         thư mục có thanh tiến độ. */
      h('div', { className: 'kr-metric' }, m
        ? h(Fragment, null,
            h('input', {
              className: 'metric-num', type: 'number', value: m.current,
              'aria-label': 'Giá trị hiện tại',
              onChange: function (e) {
                patch(function (k) { k.metric.current = Number(e.target.value) || 0; });
              }
            }),
            h('span', null, '/'),
            h('input', {
              className: 'metric-num', type: 'number', value: m.target, 'aria-label': 'Mục tiêu',
              onChange: function (e) {
                patch(function (k) { k.metric.target = Math.max(1, Number(e.target.value) || 1); });
              }
            }),
            h('input', {
              className: 'metric-unit', value: m.unit, placeholder: 'đơn vị',
              'aria-label': 'Đơn vị',
              onChange: function (e) { patch(function (k) { k.metric.unit = e.target.value; }); }
            }),
            h('button', {
              className: 'btn ghost sm',
              onClick: function () { patch(function (k) { k.metric = null; }); }
            }, 'Bỏ chỉ số'))
        : h('button', {
            className: 'btn ghost sm',
            onClick: function () {
              patch(function (k) { k.metric = { current: 0, target: 100, unit: '' }; });
            }
          }, 'Đặt chỉ số đo — đang tính theo số task xong')),

      h('div', { className: 'kr-list' },
        tasks.map(function (t) {
          return h(TaskRow, {
            key: t.id, task: t, mutate: props.mutate,
            onOpen: function () { props.openTask(t); }
          });
        }),
        h(Compose, { objective: objective, kr: kr, mutate: props.mutate })));
  }

  /* Nhập liền dòng: gõ tên → Enter là thêm, ô vẫn mở để gõ tiếp.
     Metadata gắn ngay bằng chip, không phải mở hộp thoại. */
  function Compose(props) {
    var o0 = useState(false), open = o0[0], setOpen = o0[1];
    var v0 = useState(''), value = v0[0], setValue = v0[1];
    var d0 = useState(null), date = d0[0], setDate = d0[1];
    var h0 = useState(false), high = h0[0], setHigh = h0[1];
    var inputRef = useRef(null);

    var today = D.today();
    var tomorrow = D.addDays(today, 1);

    function add() {
      var t = value.trim();
      if (!t) { setOpen(false); return; }
      props.mutate(function (d) {
        d.objectives.find(function (o) { return o.id === props.objective.id; })
          .krs.find(function (k) { return k.id === props.kr.id; })
          .tasks.push({
            id: S.uid(), title: t, note: '',
            priority: high ? 'high' : 'low', done: false, date: date, time: null
          });
      });
      setValue('');
      if (inputRef.current) inputRef.current.focus();
    }

    if (!open) {
      return h('button', { className: 'add-line', onClick: function () { setOpen(true); } },
        h(Icon, { name: 'plus', size: 18, width: 2 }), 'Thêm việc');
    }

    var custom = date && date !== today && date !== tomorrow;
    return h('div', { className: 'compose' },
      h('div', { className: 'compose-top' },
        h('span', { className: 'check', 'aria-hidden': 'true' }),
        h('input', {
          ref: inputRef, className: 'compose-input', autoFocus: true, value: value,
          placeholder: 'Việc cần làm',
          onChange: function (e) { setValue(e.target.value); },
          onKeyDown: function (e) {
            if (e.key === 'Enter') add();
            if (e.key === 'Escape') { setValue(''); setOpen(false); }
          }
        }),
        h('button', {
          className: 'chip', onClick: function () { add(); setOpen(false); }
        }, 'Xong')),
      h('div', { className: 'compose-bar' },
        h('button', {
          className: 'chip' + (date === today ? ' on' : ''),
          onClick: function () { setDate(date === today ? null : today); }
        }, 'Hôm nay'),
        h('button', {
          className: 'chip' + (date === tomorrow ? ' on' : ''),
          onClick: function () { setDate(date === tomorrow ? null : tomorrow); }
        }, 'Ngày mai'),
        h('label', { className: 'chip' + (custom ? ' on' : '') },
          h(Icon, { name: 'calendar', size: 16 }),
          custom ? D.fmtDate(date) : 'Chọn ngày',
          h('input', {
            type: 'date', value: date || '', 'aria-label': 'Chọn ngày',
            onChange: function (e) {
              setDate(D.isIsoDate(e.target.value) ? e.target.value : null);
            }
          })),
        h('button', {
          className: 'chip' + (high ? ' on' : ''), onClick: function () { setHigh(!high); }
        }, h(Icon, { name: 'flag', size: 16 }), 'Ưu tiên')));
  }

  function AddKr(props) {
    var a0 = useState(false), adding = a0[0], setAdding = a0[1];
    var v0 = useState(''), value = v0[0], setValue = v0[1];

    function add() {
      var t = value.trim();
      if (!t) return;
      props.mutate(function (d) {
        d.objectives.find(function (i) { return i.id === props.objective.id; })
          .krs.push({ id: S.uid(), title: t, metric: null, tasks: [] });
      });
      setValue(''); setAdding(false);
    }

    return h('div', null, adding
      ? h('div', { className: 'inline wrap' },
          h('input', {
            className: 'txt grow', autoFocus: true, placeholder: 'Key Result', value: value,
            onChange: function (e) { setValue(e.target.value); },
            onKeyDown: function (e) {
              if (e.key === 'Enter') add();
              if (e.key === 'Escape') setAdding(false);
            }
          }),
          h('button', { className: 'btn primary sm', onClick: add }, 'Thêm KR'),
          h('button', {
            className: 'btn ghost sm',
            onClick: function () { setAdding(false); setValue(''); }
          }, 'Huỷ'))
      : h('button', {
          className: 'btn ghost sm', onClick: function () { setAdding(true); }
        }, 'Thêm Key Result'));
  }

  /* ===================== week ===================== */

  function WeekView(props) {
    var data = props.data;
    var monday = D.addDays(D.mondayOf(D.today()), props.weekOffset * 7);
    var dates = D.weekDates(monday);
    var today = D.today();
    var flat = D.flatten(data);
    var unscheduled = D.unscheduled(data);
    var metrics = D.weekMetrics(data, monday);
    var rhythm = D.rhythmScore(metrics);
    var carry = props.weekOffset === 0
      ? D.overdue(data).filter(function (t) { return dates.indexOf(t.date) < 0; })
      : [];

    return h(Fragment, null,
      h(ScreenHeader, {
        title: 'Cả tuần', subtitle: D.fmtWeekRange(monday),
        actions: h('button', {
          className: 'icon-btn soft', 'aria-label': 'Thêm việc',
          onClick: function () { props.openNew(today); }
        }, h(Icon, { name: 'plus' }))
      }),
      h('div', { className: 'week-nav centered' },
        h('button', {
          className: 'btn sm', 'aria-label': 'Tuần trước',
          onClick: function () { props.setWeekOffset(props.weekOffset - 1); }
        }, h(Icon, { name: 'back', size: 18 })),
        h('button', {
          className: 'btn sm', onClick: function () { props.setWeekOffset(0); }
        }, 'Tuần này'),
        h('button', {
          className: 'btn sm', 'aria-label': 'Tuần sau',
          onClick: function () { props.setWeekOffset(props.weekOffset + 1); }
        }, h(Icon, { name: 'chevron', size: 18 }))),

      h('section', { className: 'dash-card week-overview' },
        h('div', { className: 'section-kicker' }, 'Tổng quan'),
        h('div', { className: 'week-stat-grid' },
          h(MiniStat, { value: metrics.total, label: 'Tổng việc' }),
          h(MiniStat, { value: metrics.done, label: 'Hoàn thành', sub: metrics.percent + '%' }),
          h(MiniStat, {
            value: metrics.highDone + '/' + metrics.high.length, label: 'Ưu tiên cao'
          }),
          h(MiniStat, { value: rhythm, label: 'Điểm nhịp' }))),

      carry.length > 0 && h('div', { className: 'notice warning' },
        h('div', null,
          h('strong', null, carry.length + ' việc từ trước đang quá hạn'),
          h('p', null, 'Chúng chưa thuộc tuần này nhưng vẫn cần một quyết định.'))),

      h('div', { className: 'group-label' }, 'Kế hoạch theo ngày'),
      h('section', { className: 'week-card-grid' }, DOW.map(function (day, i) {
        var date = dates[i];
        var tasks = D.sortDay(flat.filter(function (t) { return t.date === date; }));
        var done = tasks.filter(function (t) { return t.done; }).length;
        return h('article', {
          className: 'week-day-card' + (date === today ? ' today' : ''), key: date
        },
          h('div', { className: 'week-day-top' },
            h('div', null,
              h('strong', null, day + ' ' + D.parseYmd(date).getDate()),
              h('span', null, tasks.length + ' việc')),
            h('span', { className: 'day-ratio' }, done + '/' + tasks.length)),
          h('div', { className: 'dot-progress' },
            Array.from({ length: Math.min(5, Math.max(tasks.length, 1)) }, function (_, j) {
              return h('span', { key: j, className: j < Math.min(done, 5) ? 'on' : '' });
            })),
          h('div', { className: 'week-mini-list' }, tasks.slice(0, 3).map(function (t) {
            return h('button', {
              key: t.id, className: 'week-mini-task' + (t.done ? ' done' : ''),
              onClick: function () { props.openTask(t); }
            }, t.time && h('b', null, t.time), h('span', null, t.title));
          })),
          tasks.length > 3 && h('small', { className: 'more-count' },
            '+' + (tasks.length - 3) + ' việc khác'),
          h('button', {
            className: 'day-add', onClick: function () { props.openNew(date); }
          }, '+ Thêm việc'));
      })),

      h('div', { className: 'group-label' }, 'Việc chưa lên kế hoạch · ' + unscheduled.length),
      h('div', { className: 'group backlog-group' }, unscheduled.length
        ? unscheduled.map(function (t) {
            return h(TaskRow, {
              key: (t.loose ? 'l' : 't') + t.id, task: t, mutate: props.mutate,
              showSource: true, onOpen: function () { props.openTask(t); }
            });
          })
        : h('div', { className: 'row quiet-row' },
            h('div', { className: 'row-main' },
              h('div', { className: 'row-value' }, 'Backlog đang trống.')))));
  }

  /* ===================== routines ===================== */

  function RoutinesView(props) {
    var data = props.data;
    var a0 = useState(false), adding = a0[0], setAdding = a0[1];
    var v0 = useState(''), value = v0[0], setValue = v0[1];

    var today = D.today();
    var monday = D.mondayOf(today);
    var dates = D.weekDates(monday);
    var p0 = useState(today), picked = p0[0], setPicked = p0[1];
    var future = picked > today;

    function add() {
      var n = value.trim();
      if (!n) return;
      props.mutate(function (d) {
        d.routines.push({ id: S.uid(), name: n, target: 3, log: {} });
      });
      setValue(''); setAdding(false);
    }

    function toggle(id, date) {
      if (date > today) return;
      props.mutate(function (d) {
        var r = d.routines.find(function (i) { return i.id === id; });
        if (!r) return;
        if (r.log[date]) delete r.log[date]; else r.log[date] = true;
      });
    }

    var achieved = data.routines.filter(function (r) {
      return D.routineHits(r, monday) >= (r.target || 3);
    }).length;
    var bestStreak = data.routines.reduce(function (m, r) {
      return Math.max(m, D.weekStreak(r));
    }, 0);
    var trend = D.routineTrend(data, monday, 8);

    return h(Fragment, null,
      h(ScreenHeader, {
        title: 'Thói quen',
        subtitle: data.routines.length + ' thói quen đang theo dõi',
        actions: h('button', {
          className: 'icon-btn soft', 'aria-label': 'Thói quen mới',
          onClick: function () { setAdding(true); }
        }, h(Icon, { name: 'plus' }))
      }),

      data.routines.length > 0 && h('nav', {
        className: 'day-strip compact', 'aria-label': 'Chọn ngày'
      }, DOW.map(function (day, i) {
        var date = dates[i];
        var later = date > today;
        return h('button', {
          key: date, type: 'button', disabled: later,
          className: 'day-pick' + (date === picked ? ' on' : '') +
            (date === today ? ' today' : '') + (later ? ' future' : ''),
          onClick: function () { if (!later) setPicked(date); }
        },
          h('span', { className: 'day-pick-dow' }, day),
          h('span', { className: 'day-pick-num' }, D.parseYmd(date).getDate()));
      })),

      data.routines.length > 0 && h('section', { className: 'dash-card habit-summary' },
        h('div', { className: 'card-headline' },
          h('div', null,
            h('div', { className: 'section-kicker' }, 'Tổng quan tuần'),
            h('h2', null, achieved + ' / ' + data.routines.length + ' thói quen đạt')),
          h('span', { className: 'streak-badge' }, bestStreak + ' tuần streak')),
        h(TrendSpark, { values: trend }),
        h('div', { className: 'trend-labels' },
          h('span', null, '8 tuần trước'), h('span', null, 'Tuần này'))),

      data.routines.length === 0 && !adding && h(EmptyState, {
        title: 'Thói quen giữ nhịp.',
        text: 'Đặt số lần mỗi tuần, tick theo ngày và theo dõi chuỗi tuần đạt mục tiêu.',
        action: h('button', {
          className: 'btn primary', onClick: function () { setAdding(true); }
        }, 'Thói quen đầu tiên')
      }),

      adding && h('div', { className: 'panel' },
        h('div', { className: 'inline wrap' },
          h('input', {
            className: 'txt grow', autoFocus: true, placeholder: 'Tên thói quen', value: value,
            onChange: function (e) { setValue(e.target.value); },
            onKeyDown: function (e) {
              if (e.key === 'Enter') add();
              if (e.key === 'Escape') setAdding(false);
            }
          }),
          h('button', { className: 'btn primary', onClick: add }, 'Thêm'),
          h('button', {
            className: 'btn ghost',
            onClick: function () { setAdding(false); setValue(''); }
          }, 'Huỷ'))),

      data.routines.map(function (r) {
        var hits = D.routineHits(r, monday);
        var target = r.target || 3;
        var fill = D.routineFill(hits, target);
        var on = Boolean(r.log[picked]);
        var streak = D.weekStreak(r);

        return h('article', { className: 'routine modern', key: r.id },
          h('div', { className: 'routine-head' },
            h('div', { className: 'routine-name' },
              h(EditableText, {
                value: r.name,
                onSave: function (n) {
                  props.mutate(function (d) {
                    d.routines.find(function (i) { return i.id === r.id; }).name = n;
                  });
                }
              })),
            h('button', {
              type: 'button', disabled: future,
              className: 'routine-toggle' + (on ? ' on' : '') + (future ? ' future' : ''),
              onClick: function () { toggle(r.id, picked); }, 'aria-pressed': on
            })),
          h('div', { className: 'routine-meta' },
            streak > 0 ? streak + ' tuần liên tiếp đạt mục tiêu · ' : '',
            hits + '/' + target + ' tuần này'),
          h(Progress, { value: fill }),
          h('div', { className: 'routine-controls' },
            h('div', { className: 'routine-dots' }, dates.map(function (d) {
              return h('span', {
                key: d,
                className: 'routine-dot' + (r.log[d] ? ' on' : '') + (d === picked ? ' picked' : '')
              });
            })),
            h('input', {
              className: 'target-box', type: 'number', min: 1, max: 7, value: target,
              'aria-label': 'Số lần mỗi tuần',
              onChange: function (e) {
                props.mutate(function (d) {
                  d.routines.find(function (i) { return i.id === r.id; }).target =
                    D.clamp(Number(e.target.value) || 1, 1, 7);
                });
              }
            }),
            h('button', {
              className: 'row-del', title: 'Xoá thói quen', 'aria-label': 'Xoá thói quen',
              onClick: function () {
                props.mutate(function (d) {
                  var gone = d.routines.find(function (i) { return i.id === r.id; });
                  d.routines = d.routines.filter(function (i) { return i.id !== r.id; });
                  d.trash.push({
                    id: S.uid(), deletedAt: S.now(), kind: 'routine',
                    label: gone.name, payload: deepClone(gone)
                  });
                }, { undoLabel: 'Đã xoá thói quen' });
              }
            }, h(Icon, { name: 'trash', size: 18 }))));
      }));
  }

  /* ===================== trash ===================== */

  var KIND_LABEL = {
    task: 'Việc', kr: 'Key Result', objective: 'Objective', routine: 'Thói quen'
  };

  function TrashView(props) {
    var items = props.data.trash.slice().sort(function (a, b) {
      return b.deletedAt.localeCompare(a.deletedAt);
    });

    function restore(entry) {
      props.mutate(function (d) {
        var restored = false;
        if (entry.kind === 'objective') {
          d.objectives.push(entry.payload);
          restored = true;
        } else if (entry.kind === 'routine') {
          d.routines.push(entry.payload);
          restored = true;
        } else if (entry.kind === 'kr') {
          var o = d.objectives.find(function (i) { return i.id === entry.objId; });
          if (o) { o.krs.push(entry.payload); restored = true; }
          /* Objective gốc không còn thì giữ KR trong thùng rác thay vì làm mất
             dữ liệu. */
        } else {
          /* payload đã là bản ghi sạch; toạ độ nằm ở entry.dest. KR đã bị xoá
             thì attachTask tự thả về loose. */
          D.attachTask(d, entry.dest || 'loose', Object.assign({}, entry.payload));
          restored = true;
        }
        if (restored) d.trash = d.trash.filter(function (i) { return i.id !== entry.id; });
      });
    }

    return h(Fragment, null,
      h(ScreenHeader, {
        title: 'Đã xoá gần đây', subtitle: 'Tự dọn sau ' + S.TRASH_DAYS + ' ngày',
        onBack: props.onBack,
        actions: items.length > 0 && h('button', {
          className: 'btn danger',
          onClick: function () {
            props.mutate(function (d) { d.trash = []; }, { undoLabel: 'Đã dọn thùng rác' });
          }
        }, 'Dọn hết')
      }),
      items.length === 0
        ? h(EmptyState, {
            title: 'Thùng rác trống.',
            text: 'Mọi thứ mày xoá sẽ nằm ở đây ' + S.TRASH_DAYS + ' ngày trước khi mất hẳn.'
          })
        : h('div', { className: 'group' }, items.map(function (e) {
            return h('div', { className: 'trash-item', key: e.id },
              h('div', { className: 'trash-copy' },
                h('div', { className: 'trash-name' }, e.label),
                h('div', { className: 'trash-kind' },
                  KIND_LABEL[e.kind] + ' · xoá ' + D.fmtDate(D.ymd(new Date(e.deletedAt))))),
              h('button', {
                className: 'btn sm', onClick: function () { restore(e); }
              }, 'Khôi phục'));
          })));
  }

  /* ===================== mount ===================== */

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));

  if ('serviceWorker' in navigator) {
    global.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
}(window));
