/* Rootwork V2 — React UI and interaction only. */
(function (global) {
  'use strict';

  var React = global.React;
  var ReactDOM = global.ReactDOM;
  var D = global.RootworkDomain;
  var S = global.RootworkStore;
  var h = React.createElement;
  var Fragment = React.Fragment;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var useRef = React.useRef;
  var UI_LOCALE = 'en';

  function t(english, vietnamese) { return UI_LOCALE === 'vi' ? vietnamese : english; }
  function number(value) { return Number(value || 0).toLocaleString(UI_LOCALE === 'vi' ? 'vi-VN' : 'en-US'); }
  function dow(index) {
    return (UI_LOCALE === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : D.DOW)[index];
  }
  function fmtDate(value, options) {
    if (!D.isIsoDate(value)) return t('Unscheduled', 'Chưa xếp lịch');
    return D.parseYmd(value).toLocaleDateString(UI_LOCALE === 'vi' ? 'vi-VN' : 'en-US',
      options || { month: 'short', day: 'numeric' });
  }
  function fmtDateFull(value) {
    return fmtDate(value, { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function fmtWeekRange(monday) {
    var end = D.addDays(monday, 6);
    var startDate = D.parseYmd(monday);
    var endDate = D.parseYmd(end);
    if (UI_LOCALE === 'vi') {
      if (startDate.getMonth() === endDate.getMonth()) {
        return startDate.getDate() + '–' + endDate.getDate() + ' thg ' + (endDate.getMonth() + 1);
      }
      return startDate.getDate() + '/' + (startDate.getMonth() + 1) + '–' +
        endDate.getDate() + '/' + (endDate.getMonth() + 1);
    }
    if (startDate.getMonth() === endDate.getMonth()) {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '–' + endDate.getDate();
    }
    return fmtDate(monday) + '–' + fmtDate(end);
  }
  function fmtWeekLong(monday) {
    if (UI_LOCALE === 'vi') {
      return fmtWeekRange(monday) + ', ' + D.parseYmd(monday).getFullYear();
    }
    return D.fmtWeekLong(monday);
  }
  function levelStageLabel(stage) {
    var labels = {
      beginning: ['Beginning', 'Khởi đầu'],
      rooted: ['Rooted', 'Bám rễ'],
      momentum: ['Momentum', 'Vào guồng'],
      established: ['Established', 'Vững vàng'],
      mastery: ['Mastery', 'Tinh luyện'],
      enduring: ['Enduring', 'Bền vững']
    };
    var label = labels[stage] || labels.beginning;
    return UI_LOCALE === 'vi' ? label[1] : label[0];
  }
  function attentionLabel(item) {
    if (UI_LOCALE !== 'vi') return item.label;
    var count = Number((item.label.match(/^\d+/) || ['0'])[0]);
    if (item.tone === 'danger') return count + ' tác vụ đã quá hạn';
    if (item.tone === 'warning') return count + ' mục tiêu chưa chuyển động';
    return count + ' tác vụ đã lên lịch hôm nay';
  }
  function kindLabel(kind) {
    if (kind === 'target') return t('target', 'mục tiêu');
    if (kind === 'routine') return t('routine', 'thói quen');
    return t('action', 'tác vụ');
  }
  function localizeError(message) {
    if (UI_LOCALE !== 'vi') return message;
    var exact = {
      'Local storage is blocked. Changes will only last for this session.': 'Bộ nhớ cục bộ đang bị chặn. Thay đổi chỉ tồn tại trong phiên này.',
      'Saved data could not be opened. Nothing has been overwritten.': 'Không thể mở dữ liệu đã lưu. Không có dữ liệu nào bị ghi đè.',
      'Storage is above 3 MB. Export a backup soon.': 'Dữ liệu đã vượt 3 MB. Hãy xuất bản sao lưu sớm.',
      'Changes could not be saved on this device.': 'Không thể lưu thay đổi trên thiết bị này.',
      'Backup restored.': 'Đã khôi phục bản sao lưu.'
    };
    if (exact[message]) return exact[message];
    if (/not a Rootwork backup/i.test(message)) return 'Đây không phải bản sao lưu Rootwork.';
    if (/newer Rootwork version|newer schema/i.test(message)) return 'Bản sao lưu này đến từ phiên bản Rootwork mới hơn. Hãy cập nhật ứng dụng trước.';
    if (/cannot be read|damaged|not valid Rootwork data/i.test(message)) return 'Không thể đọc bản sao lưu này vì cấu trúc dữ liệu không hợp lệ.';
    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  var PATHS = {
    home: ['M3.5 10.5L12 3.8l8.5 6.7', 'M5.5 9.5v10h13v-10', 'M9.5 19.5v-6h5v6'],
    tree: ['M12 4v5', 'M6 20v-5h12v5', 'M6 15v-3h12v3', 'M12 9v3'],
    plus: ['M12 5v14', 'M5 12h14'],
    calendar: ['M8 3v3', 'M16 3v3', 'M3.5 9.5h17', 'M6.5 5.5h11a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3z'],
    repeat: ['M4 9.5A4.5 4.5 0 0 1 8.5 5h11', 'M16 1.5L19.5 5 16 8.5', 'M20 14.5a4.5 4.5 0 0 1-4.5 4.5h-11', 'M8 22.5L4.5 19 8 15.5'],
    menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
    archive: ['M3.5 4.5h17v4h-17z', 'M5 8.5v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-10', 'M10 12.5h4'],
    settings: ['M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6z', 'M4.6 9.5l-1.1-1.8 2.2-2.2 1.8 1.1a8.7 8.7 0 0 1 2-.8L10 3.7h4l.5 2.1a8.7 8.7 0 0 1 2 .8l1.8-1.1 2.2 2.2-1.1 1.8c.4.6.6 1.3.8 2l2.1.5v3.2l-2.1.5a8.7 8.7 0 0 1-.8 2l1.1 1.8-2.2 2.2-1.8-1.1a8.7 8.7 0 0 1-2 .8l-.5 2.1h-4l-.5-2.1a8.7 8.7 0 0 1-2-.8l-1.8 1.1-2.2-2.2 1.1-1.8a8.7 8.7 0 0 1-.8-2l-2.1-.5v-3.2l2.1-.5a8.7 8.7 0 0 1 .8-2z'],
    target: ['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z', 'M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z'],
    check: ['M5 12.5l4.5 4.5L19 7.5'],
    clock: ['M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17z', 'M12 7.5v5l3.5 2'],
    flag: ['M6 21V4.5', 'M6 5.2h10.5l-2 3.4 2 3.4H6'],
    trash: ['M4.5 6.5h15', 'M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5', 'M6.5 6.5l1 12a2 2 0 0 0 2 1.9h5a2 2 0 0 0 2-1.9l1-12'],
    close: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
    back: ['M14.5 5.5L8 12l6.5 6.5'],
    chevron: ['M9 5.5l6.5 6.5L9 18.5'],
    download: ['M12 4v11', 'M7.5 10.5L12 15l4.5-4.5', 'M4.5 19.5h15'],
    upload: ['M12 15V4', 'M7.5 8.5L12 4l4.5 4.5', 'M4.5 19.5h15'],
    edit: ['M4 20l4.2-1 10.9-10.9a2.1 2.1 0 0 0-3-3L5.2 16z', 'M14.8 6.4l3 3'],
    restore: ['M4 11a8 8 0 1 1 2.5 5.8', 'M3.5 5.5v5.5h5.5']
  };

  function Icon(props) {
    return h('svg', {
      width: props.size || 22,
      height: props.size || 22,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: props.width || 2.05,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true'
    }, (PATHS[props.name] || []).map(function (path, index) {
      return h('path', { d: path, key: index });
    }));
  }

  function LanguageToggle(props) {
    return h('div', { className: 'language-toggle', role: 'group', 'aria-label': t('Language', 'Ngôn ngữ') },
      h('button', {
        type: 'button', className: props.locale === 'en' ? 'active' : '',
        onClick: function () { props.onChange('en'); }, 'aria-pressed': props.locale === 'en'
      }, 'ENG'),
      h('span', { 'aria-hidden': 'true' }, '/'),
      h('button', {
        type: 'button', className: props.locale === 'vi' ? 'active' : '',
        onClick: function () { props.onChange('vi'); }, 'aria-pressed': props.locale === 'vi'
      }, 'VIE'));
  }

  function Progress(props) {
    var value = D.clamp(Number(props.value) || 0, 0, 100);
    return h('div', {
      className: 'progress ' + (props.className || ''),
      role: 'progressbar',
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': value
    }, h('span', { style: { width: value + '%' } }));
  }

  function PageHeader(props) {
    return h('header', { className: 'page-header' },
      h('div', { className: 'page-title-wrap' },
        props.onBack && h('button', {
          type: 'button', className: 'icon-button bare', onClick: props.onBack, 'aria-label': t('Back', 'Quay lại')
        }, h(Icon, { name: 'back' })),
        h('div', null,
          props.eyebrow && h('div', { className: 'eyebrow' }, props.eyebrow),
          h('h1', null, props.title),
          props.subtitle && h('p', null, props.subtitle))),
      props.action);
  }

  function EmptyState(props) {
    return h('div', { className: 'empty-state' },
      props.image
        ? h('img', { className: 'empty-illustration', src: props.image, alt: '' })
        : h('span', { className: 'empty-mark' }, h(Icon, { name: props.icon || 'tree', size: 25 })),
      h('h3', null, props.title),
      props.text && h('p', null, props.text),
      props.action);
  }

  function Modal(props) {
    useEffect(function () {
      function closeOnEscape(event) {
        if (event.key === 'Escape') props.onClose();
      }
      global.addEventListener('keydown', closeOnEscape);
      return function () { global.removeEventListener('keydown', closeOnEscape); };
    }, [props.onClose]);
    return h('div', {
      className: 'modal-backdrop',
      onMouseDown: function (event) {
        if (event.target === event.currentTarget) props.onClose();
      }
    }, h('section', {
      className: 'modal-sheet ' + (props.className || ''),
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': props.title
    },
      h('div', { className: 'sheet-handle', 'aria-hidden': 'true' }),
      h('header', { className: 'modal-header' },
        h('button', {
          type: 'button', className: 'icon-button bare', onClick: props.onClose, 'aria-label': t('Close', 'Đóng')
        }, h(Icon, { name: 'close' })),
        h('h2', null, props.title),
        props.action || h('span', { className: 'sheet-spacer' })),
      h('div', { className: 'modal-body' }, props.children)));
  }

  function BrandMark() {
    return h('span', { className: 'brand-title-lockup', 'aria-label': 'Rootwork' },
      h('img', { src: 'brand/rootwork-symbol.svg', alt: '', 'aria-hidden': 'true' }),
      h('strong', { className: 'brand-title-word' },
        h('span', null, 'root'),
        h('span', null, 'work')));
  }

  function LaunchLogo() {
    var lines = [
      ['M80 112 52 70', 260],
      ['M80 112 108 70', 350],
      ['M52 70 24 22', 560],
      ['M52 70 80 22', 650],
      ['M108 70 80 22', 740],
      ['M108 70 136 22', 830]
    ];
    var nodes = [
      [80, 112, 8, 130],
      [52, 70, 7, 500],
      [108, 70, 7, 580],
      [24, 22, 7, 940],
      [80, 22, 7, 1020],
      [136, 22, 7, 1100]
    ];
    return h('svg', {
      className: 'launch-symbol', viewBox: '0 0 160 132', 'aria-hidden': 'true'
    },
      h('circle', { className: 'launch-pulse', cx: 80, cy: 66, r: 58 }),
      h('g', { className: 'launch-lines' }, lines.map(function (line, index) {
        return h('path', {
          key: 'line-' + index,
          d: line[0], pathLength: 1,
          style: { '--launch-delay': line[1] + 'ms' }
        });
      })),
      h('g', { className: 'launch-nodes' }, nodes.map(function (node, index) {
        return h('circle', {
          key: 'node-' + index,
          cx: node[0], cy: node[1], r: node[2],
          style: { '--launch-delay': node[3] + 'ms' }
        });
      })));
  }

  function LaunchScreen(props) {
    return h('main', { className: 'launch-screen ' + (props.phase || 'show') },
      h('div', { className: 'launch-lockup', role: 'img', 'aria-label': 'Rootwork' },
        h(LaunchLogo),
        h('strong', { className: 'launch-wordmark' }, 'rootwork'),
        h('span', { className: 'launch-subtitle' }, t('Turn effort into progress.', 'Biến nỗ lực thành tiến bộ.'))),
      h('small', { className: 'launch-copyright' }, '© 2026 @derekdaydoi'));
  }

  function AppTopbar(props) {
    return h('header', { className: 'app-topbar' },
      h(BrandMark),
      h('div', { className: 'topbar-actions' },
        h(LanguageToggle, { locale: props.locale, onChange: props.onLocale }),
        h('button', {
          type: 'button', className: 'identity-chip', onClick: props.onProgress,
          'aria-label': t('Open long-term progress', 'Mở tiến trình dài hạn')
        }, h('b', null, t('Lv.', 'Cấp ') + props.level)),
        h('button', {
          type: 'button', className: 'icon-button', onClick: props.onMenu,
          'aria-label': t('Open menu', 'Mở trình đơn'), 'aria-expanded': props.menuOpen
        }, h(Icon, { name: 'menu', size: 23 }))),
      props.menuOpen && h(Fragment, null,
        h('button', {
          className: 'menu-scrim', onClick: props.onMenu, 'aria-label': t('Close menu', 'Đóng trình đơn')
        }),
        h('div', { className: 'menu-popover' },
          h('button', { onClick: props.onArchive }, h(Icon, { name: 'archive', size: 23 }), t('Archive', 'Lưu trữ')),
          h('button', { onClick: props.onSettings }, h(Icon, { name: 'settings', size: 23 }), t('Settings & data', 'Cài đặt & dữ liệu')))));
  }

  var NAV = [
    { id: 'home', en: 'Home', vi: 'Tuần', icon: 'home' },
    { id: 'tree', en: 'Tree', vi: 'Cây', icon: 'tree' },
    { id: 'create', en: 'Create', vi: 'Tạo', icon: 'plus' },
    { id: 'calendar', en: 'Calendar', vi: 'Lịch', icon: 'calendar' },
    { id: 'routine', en: 'Routine', vi: 'Thói quen', icon: 'repeat' }
  ];

  function BottomNav(props) {
    return h('nav', { className: 'bottom-nav', 'aria-label': t('Primary navigation', 'Điều hướng chính') },
      NAV.map(function (item) {
        var label = t(item.en, item.vi);
        if (item.id === 'create') {
          return h('button', {
            key: item.id, type: 'button', className: 'nav-create', onClick: props.onCreate,
            'aria-label': label
          }, h(Icon, { name: 'plus', size: 26, width: 2.3 }), h('span', null, label));
        }
        return h('button', {
          key: item.id,
          type: 'button',
          className: 'nav-item ' + (props.view === item.id ? 'active' : ''),
          onClick: function () { props.onView(item.id); },
          'aria-current': props.view === item.id ? 'page' : undefined
        }, h(Icon, { name: item.icon, size: 24 }), h('span', null, label));
      }));
  }

  function App() {
    var state = useState(null), data = state[0], setData = state[1];
    var launchState = useState('show'), launchPhase = launchState[0], setLaunchPhase = launchState[1];
    var localeState = useState(S.getLocale()), locale = localeState[0], setLocale = localeState[1];
    var viewState = useState('home'), view = viewState[0], setView = viewState[1];
    var sheetState = useState(null), sheet = sheetState[0], setSheet = sheetState[1];
    var menuState = useState(false), menuOpen = menuState[0], setMenuOpen = menuState[1];
    var errorState = useState(''), storageError = errorState[0], setStorageError = errorState[1];
    var toastState = useState(null), toast = toastState[0], setToast = toastState[1];
    var archiveState = useState(null), archiveWeekId = archiveState[0], setArchiveWeekId = archiveState[1];
    var loaded = useRef(false);
    var saveBlocked = useRef(false);
    var dataRef = useRef(null);
    var toastTimer = useRef(null);
    var launchTimers = useRef([]);
    UI_LOCALE = locale;
    dataRef.current = data;

    function playLaunch() {
      launchTimers.current.forEach(function (timer) { clearTimeout(timer); });
      setLaunchPhase('show');
      var reducedMotion = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      launchTimers.current = [
        setTimeout(function () { setLaunchPhase('exit'); }, reducedMotion ? 80 : 1900),
        setTimeout(function () { setLaunchPhase('done'); }, reducedMotion ? 140 : 2450)
      ];
    }

    function chooseLocale(nextLocale) {
      var safeLocale = nextLocale === 'vi' ? 'vi' : 'en';
      setLocale(safeLocale);
      S.setLocale(safeLocale);
      document.documentElement.lang = safeLocale;
    }

    useEffect(function () {
      document.documentElement.lang = locale;
    }, [locale]);

    useEffect(function () {
      if (!data) return undefined;
      playLaunch();
      return undefined;
    }, [Boolean(data)]);

    useEffect(function () {
      function launchOnReturn() {
        if (document.visibilityState === 'visible' && dataRef.current) playLaunch();
      }
      document.addEventListener('visibilitychange', launchOnReturn);
      return function () {
        document.removeEventListener('visibilitychange', launchOnReturn);
        launchTimers.current.forEach(function (timer) { clearTimeout(timer); });
      };
    }, []);

    useEffect(function () {
      if (!data) return;
      var current = D.currentWeek(data);
      if (!current || current.phase !== 'greeting') return;
      mutate(function (next) {
        var week = D.currentWeek(next);
        var previous = D.previousWeek(next, week);
        week.phase = D.setupPhase(week, previous);
        if (week.phase === 'active') {
          week.status = 'active';
          week.startedAt = week.startedAt || S.now();
        }
      });
    }, [Boolean(data)]);

    useEffect(function () {
      try {
        if (!S.writable()) {
          saveBlocked.current = true;
          setStorageError(localizeError('Local storage is blocked. Changes will only last for this session.'));
          setData(D.ensureCurrentWeek(S.empty()));
        } else {
          var restored = S.load() || S.empty();
          setData(D.ensureCurrentWeek(restored));
          if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().catch(function () {});
          }
        }
      } catch (error) {
        saveBlocked.current = true;
        setStorageError(localizeError(error.message || 'Saved data could not be opened. Nothing has been overwritten.'));
        setData(D.ensureCurrentWeek(S.empty()));
      } finally {
        loaded.current = true;
      }
    }, []);

    useEffect(function () {
      if (!loaded.current || !data || saveBlocked.current) return undefined;
      var timer = setTimeout(function () {
        try {
          S.save(data);
          if (S.nearLimit()) setStorageError(localizeError('Storage is above 3 MB. Export a backup soon.'));
        } catch (error) {
          saveBlocked.current = true;
          setStorageError(localizeError('Changes could not be saved on this device.'));
        }
      }, 80);
      return function () { clearTimeout(timer); };
    }, [data]);

    useEffect(function () {
      return function () { if (toastTimer.current) clearTimeout(toastTimer.current); };
    }, []);

    function showToast(message, action, tone) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message: message, action: action || null, tone: tone || '' });
      toastTimer.current = setTimeout(function () { setToast(null); }, 5000);
    }

    function mutate(change, options) {
      if (!dataRef.current) return;
      var before = D.clone(dataRef.current);
      var beforeLevel = D.levelState(D.totalXp(before)).level;
      var next = D.clone(dataRef.current);
      change(next);
      next.schemaVersion = S.SCHEMA;
      next.meta = Object.assign({}, next.meta || {}, { updatedAt: S.now() });
      dataRef.current = next;
      setData(next);
      if (options && options.undoLabel) {
        showToast(options.undoLabel, function () {
          dataRef.current = before;
          setData(before);
          setToast(null);
        });
      } else if (options && options.trackProgress) {
        var afterLevelState = D.levelState(D.totalXp(next));
        var afterLevel = afterLevelState.level;
        var earned = Math.max(0, D.totalXp(next) - D.totalXp(before));
        if (afterLevel > beforeLevel) {
          showToast(
            t('Level ' + afterLevel + ' · ' + levelStageLabel(afterLevelState.stage),
              'Cấp ' + afterLevel + ' · ' + levelStageLabel(afterLevelState.stage)),
            null,
            'level'
          );
        } else if (earned > 0) {
          showToast('+' + earned + ' XP · ' + t('Progress recorded', 'Đã ghi nhận tiến bộ'));
        }
      }
    }

    function openCreate(kind, preset) {
      if (kind === 'task') {
        setSheet({ kind: 'task', presetTargetId: preset && preset.targetId, presetDate: preset && preset.date });
      } else if (kind === 'target') {
        setSheet({ kind: 'target' });
      } else if (kind === 'routine') {
        setSheet({ kind: 'routine' });
      } else {
        setSheet({ kind: 'create' });
      }
    }

    function openTask(task) { setSheet({ kind: 'task', task: task }); }
    function openTarget(target) { setSheet({ kind: 'target', target: target }); }
    function openRoutine(routine) { setSheet({ kind: 'routine', routine: routine }); }

    function onImport(file) {
      S.importBackup(file, function (error, imported) {
        if (error) {
          setStorageError(localizeError(error));
          showToast(localizeError(error));
          return;
        }
        var next = D.ensureCurrentWeek(imported);
        dataRef.current = next;
        setData(next);
        setStorageError('');
        showToast(localizeError('Backup restored.'));
      });
    }

    if (!data) return h(LaunchScreen, { phase: 'show' });

    var week = D.currentWeek(data);
    var previous = week ? D.previousWeek(data, week) : null;
    var level = D.levelState(D.totalXp(data));

    if (week && week.phase !== 'active') {
      return h(Fragment, null,
        h(WeekStartFlow, {
          data: data,
          week: week,
          previous: previous,
          mutate: mutate,
          openTarget: openTarget,
          openCreate: openCreate,
          locale: locale,
          onLocale: chooseLocale
        }),
        renderSheet());
    }

    function changeView(nextView) {
      setView(nextView);
      setMenuOpen(false);
      if (nextView !== 'archive') setArchiveWeekId(null);
      global.scrollTo(0, 0);
    }

    function renderContent() {
      var shared = {
        data: data,
        week: week,
        mutate: mutate,
        openTask: openTask,
        openTarget: openTarget,
        openRoutine: openRoutine,
        openCreate: openCreate,
        setView: changeView,
        locale: locale,
        onLocale: chooseLocale
      };
      if (view === 'tree') return h(TreeView, shared);
      if (view === 'calendar') return h(CalendarView, shared);
      if (view === 'routine') return h(RoutineView, shared);
      if (view === 'progress') return h(ProgressView, Object.assign({}, shared, {
        onBack: function () { changeView('home'); },
        onOpenArchive: function (weekId) {
          setArchiveWeekId(weekId || null);
          changeView('archive');
        }
      }));
      if (view === 'archive') return h(ArchiveView, Object.assign({}, shared, {
        selectedId: archiveWeekId,
        setSelectedId: setArchiveWeekId,
        onBack: function () { changeView('home'); }
      }));
      if (view === 'settings') return h(SettingsView, Object.assign({}, shared, {
        storageError: storageError,
        onExport: function () { S.exportBackup(data); },
        onImport: onImport,
        onBack: function () { changeView('home'); }
      }));
      return h(HomeView, shared);
    }

    function renderSheet() {
      if (!sheet) return null;
      var close = function () { setSheet(null); };
      if (sheet.kind === 'create') {
        return h(CreateMenu, {
          onClose: close,
          onChoose: function (kind) { close(); openCreate(kind); }
        });
      }
      if (sheet.kind === 'task') {
        return h(TaskSheet, {
          data: dataRef.current,
          week: D.currentWeek(dataRef.current),
          spec: sheet,
          mutate: mutate,
          onClose: close
        });
      }
      if (sheet.kind === 'target') {
        return h(TargetSheet, {
          week: D.currentWeek(dataRef.current),
          spec: sheet,
          mutate: mutate,
          onClose: close
        });
      }
      if (sheet.kind === 'routine') {
        return h(RoutineSheet, {
          data: dataRef.current,
          spec: sheet,
          mutate: mutate,
          onClose: close
        });
      }
      return null;
    }

    var showTopbar = view === 'home';
    return h(Fragment, null,
      h('div', { className: 'app-shell' },
        showTopbar && h(AppTopbar, {
          name: data.profile.name,
          level: level.level,
          locale: locale,
          onLocale: chooseLocale,
          menuOpen: menuOpen,
          onMenu: function () { setMenuOpen(!menuOpen); },
          onArchive: function () { changeView('archive'); },
          onProgress: function () { changeView('progress'); },
          onSettings: function () { changeView('settings'); }
        }),
        storageError && h('div', { className: 'system-notice' }, storageError),
        renderContent()),
      view !== 'archive' && view !== 'progress' && view !== 'settings' && h(BottomNav, {
        view: view,
        onView: changeView,
        onCreate: function () { openCreate(); }
      }),
      renderSheet(),
      toast && h('div', { className: 'toast ' + (toast.tone || ''), role: 'status' },
        h('span', null, toast.message),
        toast.action && h('button', { onClick: toast.action }, t('Undo', 'Hoàn tác'))),
      launchPhase !== 'done' && h(LaunchScreen, { phase: launchPhase }));
  }

  function WeekStartFlow(props) {
    var week = props.week;
    var previous = props.previous;

    function setPhase(phase) {
      props.mutate(function (data) {
        var current = D.findWeek(data, week.id);
        current.phase = phase;
        if (phase === 'active') {
          current.status = 'active';
          current.startedAt = current.startedAt || S.now();
          current.targets = current.targets.filter(function (target) { return target.status !== 'removed'; });
        }
      });
    }

    if (week.phase === 'review') {
      var liveTargets = week.targets;
      function continueFlow() { setPhase(previous ? 'recap' : 'active'); }
      return h('main', { className: 'start-screen review-screen' },
        h('div', { className: 'start-flow-top' },
          h('div', { className: 'start-step' }, t('01 · Choose the week', '01 · Chọn mục tiêu')),
          h(LanguageToggle, { locale: props.locale, onChange: props.onLocale })),
        h('header', { className: 'review-heading' },
          h('h1', null, t('Keep or change your targets?', 'Giữ hay thay đổi mục tiêu?')),
          h('p', null, week.importedLegacy
            ? t('Your existing Rootwork objectives are ready as weekly targets.', 'Mục tiêu Rootwork cũ đã sẵn sàng cho tuần này.')
            : t('Use last week as a starting point.', 'Dùng tuần trước làm điểm bắt đầu.'))),
        h('div', { className: 'review-list' },
          liveTargets.length ? liveTargets.map(function (target) {
            var metrics = D.targetMetrics(target);
            return h('article', {
              className: 'review-target ' + (target.status === 'removed' ? 'removed' : ''),
              key: target.id
            },
              h('div', { className: 'review-target-copy' },
                h('span', { className: 'target-status-dot' }),
                h('div', null,
                  h('h2', null, target.title),
                  target.description && h('p', null, target.description),
                  h('small', null, metrics.total + ' ' + t(metrics.total === 1 ? 'action' : 'actions', 'tác vụ')))),
              h('div', { className: 'review-actions' },
                target.status !== 'removed' && h('button', {
                  className: 'icon-button bare', onClick: function () { props.openTarget(target); },
                  'aria-label': t('Edit ', 'Sửa ') + target.title
                }, h(Icon, { name: 'edit', size: 22 })),
                h('button', {
                  className: 'text-button',
                  onClick: function () {
                    props.mutate(function (data) {
                      var currentTarget = D.findTarget(data, week.id, target.id);
                      currentTarget.status = currentTarget.status === 'removed' ? 'active' : 'removed';
                    });
                  }
                }, target.status === 'removed' ? t('Keep', 'Giữ') : t('Remove', 'Bỏ'))));
          }) : h(EmptyState, {
            icon: 'target',
            title: t('Start with one clear target.', 'Bắt đầu bằng một mục tiêu rõ ràng.'),
            action: h('button', {
              className: 'secondary-button', onClick: function () { props.openCreate('target'); }
            }, t('Add a target', 'Thêm mục tiêu'))
          })),
        h('button', {
          className: 'add-target-line', onClick: function () { props.openCreate('target'); }
        }, h(Icon, { name: 'plus', size: 21 }), t('Add another target', 'Thêm mục tiêu khác')),
        h('div', { className: 'review-footer' },
          h('button', { className: 'secondary-button', onClick: continueFlow }, t('Keep as it is', 'Giữ nguyên')),
          h('button', { className: 'primary-button', onClick: continueFlow }, t('Continue', 'Tiếp tục'))));
    }

    if (week.phase === 'recap' && previous) {
      var recap = previous.recap || D.buildRecap(previous, props.data.routines);
      return h('main', { className: 'start-screen recap-screen' },
        h('div', { className: 'start-flow-top' },
          h('div', { className: 'start-step' }, t('02 · Last week', '02 · Tuần trước')),
          h(LanguageToggle, { locale: props.locale, onChange: props.onLocale })),
        h('header', { className: 'recap-heading' },
          h('div', null,
            h('span', null, t('Week ', 'Tuần ') + D.isoWeek(previous.startDate)),
            h('h1', null, t('This is what moved.', 'Đây là những gì đã tiến lên.'))),
          h('strong', null, recap.completion + '%')),
        h(ProgressionTree, { week: previous, readonly: true, recap: true }),
        h(RecapStats, { recap: recap }),
        h('button', {
          className: 'primary-button start-cta',
          onClick: function () { setPhase('active'); }
        }, t('Enter Week ', 'Vào Tuần ') + D.isoWeek(week.startDate), h(Icon, { name: 'chevron', size: 23 })));
    }

    return h('main', { className: 'start-screen' });
  }

  function RecapStats(props) {
    var recap = props.recap;
    return h('section', { className: 'recap-stats' },
      h('div', null, h('strong', null, '+' + number(recap.xpEarned)), h('span', null, t('XP earned', 'XP đã nhận'))),
      h('div', null, h('strong', null, recap.targetsAdvanced), h('span', null, t('targets advanced', 'mục tiêu tiến lên'))),
      h('div', null, h('strong', null, recap.targetsStalled), h('span', null, t('targets stalled', 'mục tiêu chững lại'))),
      h('div', null, h('strong', null, recap.routineConsistency + '%'), h('span', null, t('routine consistency', 'độ đều thói quen'))));
  }

  function HomeView(props) {
    var week = props.week;
    if (!week.targets.length && !week.looseTasks.length) return h(BlankWeekView, props);
    var metrics = D.weekMetrics(week, props.data.routines);
    var level = D.levelState(D.totalXp(props.data));
    var weekXp = D.weekXp(week, props.data.routines);
    var tasks = D.weekTasks(week);
    var todayTasks = D.sortTasks(tasks.filter(function (task) {
      return task.date === D.today() && !task.done;
    }));
    var attention = D.attentionItems(week);
    return h(Fragment, null,
      h('section', { className: 'campaign-header' },
        h('div', null,
          h('h1', null, t('Week ', 'Tuần ') + D.isoWeek(week.startDate)),
          h('p', null, fmtWeekRange(week.startDate))),
        h('div', { className: 'campaign-percent' }, metrics.completion + '%')),
      h(Progress, { value: metrics.completion, className: 'campaign-progress' }),
      h('button', {
        type: 'button',
        className: 'identity-progress',
        onClick: function () { props.setView('progress'); },
        'aria-label': t('Open long-term progress', 'Mở tiến trình dài hạn')
      },
        h('div', { className: 'level-number' },
          h('span', null, t('LEVEL', 'CẤP')),
          h('strong', null, level.level)),
        h('div', { className: 'identity-progress-copy' },
          h('div', { className: 'level-heading' },
            h('div', null,
              h('strong', null, props.data.profile.name),
              h('span', null, levelStageLabel(level.stage))),
            h('span', null, number(level.remainingXp) + ' ' + t('XP to Level ', 'XP để đạt Cấp ') + level.nextLevel)),
          h(Progress, { value: level.percent }),
          h('div', { className: 'level-meta' },
            h('span', null, number(level.currentXp) + ' / ' + number(level.neededXp) + ' XP'),
            h('strong', null, '+' + number(weekXp) + ' ' + t('XP this week', 'XP tuần này'))))),
      h('section', { className: 'home-section today-focus' },
        h('div', { className: 'section-heading' },
          h('h2', null, t('What matters today', 'Điều quan trọng hôm nay')),
          h('button', { className: 'text-button', onClick: function () { props.setView('calendar'); } }, t('Open day', 'Mở lịch'))),
        todayTasks.length ? h('div', { className: 'task-list' }, todayTasks.slice(0, 4).map(function (task) {
          return h(ActionRow, {
            key: task.id,
            task: task,
            onToggle: function () { toggleTask(props, task); },
            onOpen: function () { props.openTask(task); }
          });
        })) : h('div', { className: 'quiet-panel' },
          h('strong', null, t('No actions scheduled for today.', 'Hôm nay chưa có tác vụ nào.')),
          h('button', { className: 'text-button', onClick: function () { props.setView('tree'); } }, t('Open the tree', 'Mở cây mục tiêu')))),
      h('section', { className: 'home-section' },
        h('div', { className: 'section-heading' },
          h('h2', null, t('Targets in motion', 'Mục tiêu đang tiến lên')),
          h('button', { className: 'text-button', onClick: function () { props.setView('tree'); } }, t('Full tree', 'Xem cây'))),
        week.targets.length ? h('div', { className: 'target-summary-list' }, week.targets.map(function (target) {
          var result = D.targetMetrics(target);
          return h('button', {
            key: target.id, className: 'target-summary', onClick: function () { props.setView('tree'); }
          },
            h('span', { className: 'target-index' }, String(week.targets.indexOf(target) + 1).padStart(2, '0')),
            h('div', null, h('strong', null, target.title), h('small', null,
              t(result.done + ' of ' + result.total + ' actions', result.done + '/' + result.total + ' tác vụ'))),
            h('span', { className: 'target-percent' }, result.percent + '%'));
        })) : h(EmptyState, {
          icon: 'target',
          title: t('A blank week is an opportunity.', 'Một tuần trống là một cơ hội.'),
          text: t('What are we building this week?', 'Tuần này ta sẽ xây điều gì?'),
          action: h('button', {
            className: 'primary-button small', onClick: function () { props.openCreate('target'); }
          }, t('Build my week', 'Dựng tuần mới'))
        })),
      h('section', { className: 'home-section attention-section' },
        h('div', { className: 'section-heading' },
          h('h2', null, t('Needs a decision', 'Cần quyết định'))),
        attention.length ? h('div', { className: 'signal-list' }, attention.map(function (item, index) {
          return h('div', { className: 'signal ' + item.tone, key: index },
            h('span', null), h('strong', null, attentionLabel(item)));
        })) : h('div', { className: 'quiet-panel compact' }, t('Nothing is competing for attention.', 'Không có gì đang tranh nhau sự chú ý.'))));
  }

  function BlankWeekView(props) {
    return h('section', { className: 'blank-week-builder' },
        h('div', { className: 'blank-week-visual' },
          h('span', null, t('NEW WEEK', 'TUẦN MỚI')),
          h('strong', null, D.isoWeek(props.week.startDate))),
        h('div', { className: 'blank-week-copy' },
          h('h2', null, t('A blank week is an opportunity.', 'Một tuần trống là một cơ hội.')),
          h('p', null, t('What are we building this week?', 'Tuần này ta sẽ xây điều gì?'))),
        h('button', {
          className: 'primary-button blank-week-cta', onClick: function () { props.openCreate(); }
        }, t('Build my week', 'Dựng tuần mới'), h(Icon, { name: 'chevron', size: 22 })));
  }

  function toggleTask(props, task) {
    props.mutate(function (data) {
      var record = D.findTask(data, task);
      if (!record) return;
      record.done = !record.done;
      record.completedAt = record.done ? S.now() : null;
    }, { trackProgress: true });
  }

  function ActionRow(props) {
    var task = props.task;
    var late = task.date && !task.done && task.date < D.today();
    return h('div', {
      className: 'action-row ' + (task.done ? 'done' : ''),
      onClick: props.onOpen,
      role: 'button',
      tabIndex: 0,
      onKeyDown: function (event) { if (event.key === 'Enter') props.onOpen(); }
    },
      h('button', {
        type: 'button',
        className: 'action-check ' + (task.done ? 'checked' : ''),
        onClick: function (event) { event.stopPropagation(); props.onToggle(); },
        'aria-label': task.done ? t('Mark incomplete', 'Đánh dấu chưa xong') : t('Mark complete', 'Đánh dấu hoàn tất'),
        'aria-pressed': task.done
      }, task.done && h(Icon, { name: 'check', size: 14, width: 2.8 })),
      h('div', { className: 'action-copy' },
        h('strong', null, task.title),
        h('div', { className: 'action-meta' },
          task.priority === 'high' && h('span', { className: 'priority-tag' }, t('Priority', 'Ưu tiên')),
          task.time && h('span', null, task.time),
          h('span', { className: late ? 'late' : '' }, task.date ? fmtDate(task.date) : t('Unscheduled', 'Chưa xếp lịch')),
          task.targetTitle && h('span', null, task.loose ? t('Loose action', 'Tác vụ phát sinh') : task.targetTitle))));
  }

  function TreeView(props) {
    return h(Fragment, null,
      h(PageHeader, {
        title: t('Week ' + D.isoWeek(props.week.startDate) + ' goals', 'Mục tiêu tuần ' + D.isoWeek(props.week.startDate)),
        subtitle: fmtWeekRange(props.week.startDate),
        action: h('button', {
          className: 'icon-button',
          onClick: function () { props.openCreate('target'); },
          'aria-label': t('Add target', 'Thêm mục tiêu')
        }, h(Icon, { name: 'plus', size: 24 }))
      }),
      props.week.targets.length ? h(ProgressionTree, {
        week: props.week,
        onToggle: function (task) { toggleTask(props, task); },
        onOpenTask: props.openTask,
        onAddTask: function (target) { props.openCreate('task', { targetId: target.id }); },
        onEditTarget: props.openTarget
      }) : h(EmptyState, {
        icon: 'tree',
        title: t('A tree starts with one target.', 'Một cái cây bắt đầu từ một mục tiêu.'),
        action: h('button', {
          className: 'primary-button small', onClick: function () { props.openCreate('target'); }
        }, t('Add target', 'Thêm mục tiêu'))
      }),
      h(LooseActions, props));
  }

  function ProgressionTree(props) {
    var week = props.week;
    var isCurrentTree = !props.recap && !props.compact;
    return h('section', {
      className: 'progression-tree ' + (props.recap ? 'recap-tree' : '') +
        (props.compact ? ' compact-tree' : '') + (isCurrentTree ? ' current-tree' : '')
    },
      !isCurrentTree && h('div', { className: 'week-node' },
        h('span', null, t('WEEK', 'TUẦN')),
        h('strong', null, D.isoWeek(week.startDate)),
        h('small', null, fmtWeekRange(week.startDate))),
      !isCurrentTree && h('div', { className: 'tree-trunk', 'aria-hidden': 'true' }),
      h('div', { className: 'tree-branches' },
        (week.targets || []).filter(function (target) { return target.status !== 'removed'; }).map(function (target, targetIndex) {
          var metrics = D.targetMetrics(target);
          return h('article', {
            className: 'tree-branch',
            key: target.id,
            style: { '--branch-delay': (targetIndex * 110 + 180) + 'ms' }
          },
            h('div', { className: 'branch-connector', 'aria-hidden': 'true' }),
            h('div', { className: 'target-node' },
              h('button', {
                className: 'target-node-main',
                onClick: props.onEditTarget ? function () { props.onEditTarget(target); } : undefined
              },
                h('span', { className: 'target-node-kicker' }, isCurrentTree
                  ? String(targetIndex + 1).padStart(2, '0')
                  : t('TARGET ', 'MỤC TIÊU ') + String(targetIndex + 1).padStart(2, '0')),
                h('strong', null, target.title),
                target.description && h('small', null, target.description)),
              h('div', { className: 'target-node-progress' },
                h('strong', null, metrics.total ? metrics.percent + '%' : '—'),
                h('span', null, metrics.total
                  ? metrics.done + '/' + metrics.total
                  : t('0 actions', '0 tác vụ')))),
            h('div', { className: 'action-stem', 'aria-hidden': 'true' }),
            h('div', { className: 'tree-actions' },
              (target.tasks || []).length ? target.tasks.map(function (rawTask, taskIndex) {
                var task = Object.assign({}, rawTask, {
                  weekId: week.id,
                  targetId: target.id,
                  targetTitle: target.title,
                  loose: false
                });
                return h('div', {
                  className: 'tree-action ' + (task.done ? 'done' : ''),
                  key: task.id,
                  style: { '--action-delay': (targetIndex * 110 + taskIndex * 70 + 420) + 'ms' }
                },
                  h('button', {
                    className: 'tree-action-check ' + (task.done ? 'checked' : ''),
                    disabled: props.readonly,
                    onClick: props.onToggle ? function () { props.onToggle(task); } : undefined,
                    'aria-label': task.done ? t('Completed', 'Đã xong') : t('Incomplete', 'Chưa xong')
                  }, task.done && h(Icon, { name: 'check', size: 12, width: 2.8 })),
                  h('button', {
                    className: 'tree-action-copy',
                    disabled: props.readonly,
                    onClick: props.onOpenTask ? function () { props.onOpenTask(task); } : undefined
                  },
                    h('strong', null, task.title),
                    h('small', null, task.date ? fmtDate(task.date) + (task.time ? ' · ' + task.time : '') : t('Unscheduled', 'Chưa xếp lịch'))));
              }) : null,
              props.onAddTask && h('button', {
                className: 'tree-add-action ' + ((target.tasks || []).length ? '' : 'empty'),
                onClick: function () { props.onAddTask(target); }
              }, h(Icon, { name: 'plus', size: 20 }),
              (target.tasks || []).length ? t('Add action', 'Thêm tác vụ') : t('Add first action', 'Thêm tác vụ đầu tiên'))));
        })));
  }

  function LooseActions(props) {
    var tasks = D.sortTasks(D.weekTasks(props.week).filter(function (task) { return task.loose; }));
    return h('section', { className: 'loose-section' },
      h('div', { className: 'section-heading' },
        h('h2', null, t('Spontaneous actions', 'Tác vụ phát sinh')),
        h('button', {
          className: 'text-button', onClick: function () { props.openCreate('task', {}); }
        }, t('Add action', 'Thêm tác vụ'))),
      tasks.length ? h('div', { className: 'task-list' }, tasks.map(function (task) {
        return h(ActionRow, {
          key: task.id,
          task: task,
          onToggle: function () { toggleTask(props, task); },
          onOpen: function () { props.openTask(task); }
        });
      })) : h('div', { className: 'quiet-panel compact' }, t('No spontaneous actions.', 'Chưa có tác vụ phát sinh.')));
  }

  function CalendarView(props) {
    var pickedState = useState(D.today()), picked = pickedState[0], setPicked = pickedState[1];
    var dates = D.weekDates(props.week.startDate);
    if (dates.indexOf(picked) < 0) picked = props.week.startDate;
    var tasks = D.sortTasks(D.weekTasks(props.week).filter(function (task) { return task.date === picked; }));
    var timed = tasks.filter(function (task) { return task.time; });
    var flexible = tasks.filter(function (task) { return !task.time; });
    var unscheduled = D.sortTasks(D.weekTasks(props.week).filter(function (task) { return !task.date && !task.done; }));
    return h(Fragment, null,
      h(PageHeader, {
        title: t('Week ' + D.isoWeek(props.week.startDate), 'Tuần ' + D.isoWeek(props.week.startDate)),
        subtitle: fmtWeekRange(props.week.startDate),
        action: h('button', {
          className: 'icon-button',
          onClick: function () { props.openCreate('task', { date: picked }); },
          'aria-label': t('Add action', 'Thêm tác vụ')
        }, h(Icon, { name: 'plus', size: 24 }))
      }),
      h('nav', { className: 'day-strip', 'aria-label': t('Days this week', 'Các ngày trong tuần') },
        dates.map(function (date, index) {
          return h('button', {
            key: date,
            className: 'day-button ' + (date === picked ? 'active ' : '') + (date === D.today() ? 'today' : ''),
            onClick: function () { setPicked(date); }
          }, h('span', null, dow(index)), h('strong', null, D.parseYmd(date).getDate()));
        })),
      h('div', { className: 'agenda-date' },
        h('h2', null, picked === D.today() ? t('Today', 'Hôm nay') : fmtDateFull(picked)),
        h('span', null, tasks.filter(function (task) { return task.done; }).length + '/' + tasks.length + ' ' + t('complete', 'đã xong'))),
      h(AgendaSection, {
        title: t('Timed', 'Có giờ'),
        empty: t('No fixed-time actions.', 'Chưa có tác vụ theo giờ.'),
        tasks: timed,
        props: props
      }),
      h(AgendaSection, {
        title: t('Any time', 'Linh hoạt'),
        empty: t('No flexible actions on this day.', 'Ngày này chưa có tác vụ linh hoạt.'),
        tasks: flexible,
        props: props
      }),
      h('section', { className: 'agenda-section unscheduled-agenda' },
        h('div', { className: 'agenda-section-title' },
          h('h3', null, t('Unscheduled', 'Chưa xếp lịch')),
          h('span', null, unscheduled.length)),
        unscheduled.length ? h('div', { className: 'task-list' }, unscheduled.map(function (task) {
          return h(ActionRow, {
            key: task.id,
            task: task,
            onToggle: function () { toggleTask(props, task); },
            onOpen: function () { props.openTask(task); }
          });
        })) : h('div', { className: 'quiet-panel compact' }, t('No actions waiting for a day.', 'Không có tác vụ nào đang chờ xếp ngày.'))));
  }

  function AgendaSection(props) {
    return h('section', { className: 'agenda-section' },
      h('div', { className: 'agenda-section-title' },
        h('h3', null, props.title),
        h('span', null, props.tasks.length)),
      props.tasks.length ? h('div', { className: 'task-list' }, props.tasks.map(function (task) {
        return h(ActionRow, {
          key: task.id,
          task: task,
          onToggle: function () { toggleTask(props.props, task); },
          onOpen: function () { props.props.openTask(task); }
        });
      })) : h('div', { className: 'quiet-panel compact' }, props.empty));
  }

  function RoutineView(props) {
    var dates = D.weekDates(props.week.startDate);
    return h(Fragment, null,
      h(PageHeader, {
        eyebrow: D.routineConsistency(props.data.routines, props.week.startDate) + '% ' + t('consistent', 'đều đặn'),
        title: t('Routine', 'Thói quen'),
        action: h('button', {
          className: 'icon-button',
          onClick: function () { props.openCreate('routine'); },
          'aria-label': t('Add routine', 'Thêm thói quen')
        }, h(Icon, { name: 'plus', size: 24 }))
      }),
      props.data.routines.length ? h('div', { className: 'routine-list' },
        props.data.routines.map(function (routine) {
          var snapshot = D.routineSnapshot(routine, props.week.startDate);
          var streak = D.routineWeekStreak(routine);
          return h('article', { className: 'routine-card', key: routine.id },
            h('header', null,
              h('button', { onClick: function () { props.openRoutine(routine); } },
                h('strong', null, routine.name),
                h('small', null, routine.recurrence.type === 'daily'
                  ? t('Daily', 'Hằng ngày') : snapshot.target + ' ' + t('times weekly', 'lần mỗi tuần'))),
              h('div', { className: 'routine-score' },
                h('strong', null, snapshot.hits + '/' + snapshot.target),
                streak > 0 && h('span', null, t(streak + 'w streak', streak + ' tuần liên tiếp')))),
            h('div', { className: 'routine-week' },
              dates.map(function (date, index) {
                var on = Boolean(routine.log[date]);
                var future = date > D.today();
                return h('button', {
                  key: date,
                  disabled: future,
                  className: 'routine-day ' + (on ? 'done ' : '') + (date === D.today() ? 'today' : ''),
                  onClick: function () {
                    props.mutate(function (data) {
                      var record = data.routines.find(function (item) { return item.id === routine.id; });
                      if (record.log[date]) delete record.log[date]; else record.log[date] = true;
                    }, { trackProgress: true });
                  },
                  'aria-label': (on ? t('Remove ', 'Bỏ đánh dấu ') : t('Complete ', 'Hoàn tất ')) + routine.name + ' · ' + fmtDateFull(date)
                }, h('span', null, dow(index)), h('i', null, on && h(Icon, { name: 'check', size: 14, width: 2.8 })));
              })),
            h(Progress, { value: snapshot.percent }));
        })) : h(EmptyState, {
        icon: 'repeat',
        title: t('Routine protects the baseline.', 'Thói quen giữ vững nền tảng.'),
        action: h('button', {
          className: 'primary-button small', onClick: function () { props.openCreate('routine'); }
        }, t('Add routine', 'Thêm thói quen'))
      }));
  }

  function ArchiveView(props) {
    var completed = props.data.weeks.filter(function (week) {
      return week.status === 'complete';
    }).sort(function (a, b) { return b.startDate.localeCompare(a.startDate); });
    var selected = props.selectedId && D.findWeek(props.data, props.selectedId);
    if (selected) {
      var recap = selected.recap || D.buildRecap(selected, []);
      return h(Fragment, null,
        h(PageHeader, {
          eyebrow: fmtWeekLong(selected.startDate),
          title: t('Week ', 'Tuần ') + D.isoWeek(selected.startDate),
          onBack: function () { props.setSelectedId(null); }
        }),
        h('div', { className: 'archive-hero' },
          h('strong', null, recap.completion + '%'),
          h('span', null, '+' + number(recap.xpEarned) + ' XP'),
          h(Progress, { value: recap.completion })),
        h(ProgressionTree, { week: selected, readonly: true }),
        h(RecapStats, { recap: recap }));
    }
    var trend = D.archiveTrend(props.data, 8);
    return h(Fragment, null,
      h(PageHeader, {
        title: t('Archive', 'Lưu trữ'),
        onBack: props.onBack
      }),
      trend.length > 1 && h('section', { className: 'trend-card' },
        h('div', { className: 'section-heading' },
          h('h2', null, t('Execution trend', 'Xu hướng thực hiện'))),
        h('div', { className: 'trend-bars' }, trend.map(function (item) {
          return h('div', { className: 'trend-bar-wrap', key: item.week },
            h('div', { className: 'trend-bar' }, h('span', { style: { height: item.completion + '%' } })),
            h('small', null, t('W', 'T') + item.week));
        }))),
      completed.length ? h('div', { className: 'archive-list' }, completed.map(function (week) {
        var recap = week.recap || D.buildRecap(week, []);
        return h('button', {
          className: 'archive-row', key: week.id, onClick: function () { props.setSelectedId(week.id); }
        },
          h('div', { className: 'archive-week' },
            h('strong', null, t('Week ', 'Tuần ') + D.isoWeek(week.startDate)),
            h('span', null, fmtWeekRange(week.startDate))),
          h('div', { className: 'archive-result' },
            h('strong', null, recap.completion + '%'),
            h('span', null, '+' + number(recap.xpEarned) + ' XP')),
          h(Icon, { name: 'chevron', size: 18 }));
      })) : h(EmptyState, {
        icon: 'archive',
        title: t('History begins after this week.', 'Lịch sử bắt đầu sau tuần này.'),
        text: t('Completed weeks stay here as records.', 'Các tuần đã hoàn tất sẽ được lưu lại tại đây.')
      }));
  }

  function ProgressView(props) {
    var level = D.levelState(D.totalXp(props.data));
    var currentXp = D.weekXp(props.week, props.data.routines);
    var completed = props.data.weeks.filter(function (week) {
      return week.status === 'complete';
    }).sort(function (a, b) { return b.startDate.localeCompare(a.startDate); });
    var summaries = completed.map(function (week) {
      return { week: week, recap: week.recap || D.buildRecap(week, []) };
    });
    var average = summaries.length ? Math.round(summaries.reduce(function (sum, item) {
      return sum + item.recap.completion;
    }, 0) / summaries.length) : 0;
    var targetsAdvanced = summaries.reduce(function (sum, item) {
      return sum + item.recap.targetsAdvanced;
    }, 0);
    return h(Fragment, null,
      h(PageHeader, {
        title: t('Progress', 'Tiến trình'),
        onBack: props.onBack
      }),
      h('section', { className: 'progress-level-card' },
        h('div', { className: 'progress-level-top' },
          h('span', null, levelStageLabel(level.stage)),
          h('span', null, number(level.totalXp) + ' XP')),
        h('div', { className: 'progress-level-main' },
          h('div', null,
            h('span', null, t('LEVEL', 'CẤP')),
            h('strong', null, level.level)),
          h('div', null,
            h('strong', null, props.data.profile.name),
            h('span', null, number(level.remainingXp) + ' ' + t('XP to Level ', 'XP để đạt Cấp ') + level.nextLevel))),
        h(Progress, { value: level.percent }),
        h('div', { className: 'progress-level-meta' },
          h('span', null, number(level.currentXp) + ' / ' + number(level.neededXp) + ' XP'),
          h('strong', null, '+' + number(currentXp) + ' ' + t('this week', 'tuần này')))),
      h('section', { className: 'progress-facts' },
        h('div', null, h('strong', null, completed.length), h('span', null, t('weeks recorded', 'tuần đã ghi lại'))),
        h('div', null, h('strong', null, average + '%'), h('span', null, t('average execution', 'thực hiện trung bình'))),
        h('div', null, h('strong', null, targetsAdvanced), h('span', null, t('targets advanced', 'mục tiêu tiến lên')))),
      h('section', { className: 'recent-progress' },
        h('div', { className: 'section-heading' },
          h('h2', null, t('Recent weeks', 'Các tuần gần đây')),
          h('button', { className: 'text-button', onClick: function () { props.onOpenArchive(); } }, t('Archive', 'Lưu trữ'))),
        summaries.length ? h('div', { className: 'progress-week-list' }, summaries.slice(0, 5).map(function (item) {
          return h('button', {
            key: item.week.id,
            onClick: function () { props.onOpenArchive(item.week.id); }
          },
            h('div', null,
              h('strong', null, t('Week ', 'Tuần ') + D.isoWeek(item.week.startDate)),
              h('span', null, fmtWeekRange(item.week.startDate))),
            h('div', null,
              h('strong', null, item.recap.completion + '%'),
              h('span', null, '+' + number(item.recap.xpEarned) + ' XP')),
            h(Icon, { name: 'chevron', size: 18 }));
        })) : h('div', { className: 'quiet-panel' },
          h('strong', null, t('Your first record is being written.', 'Tuần đầu tiên của bạn đang được viết.')))));
  }

  function SettingsView(props) {
    var nameState = useState(props.data.profile.name), name = nameState[0], setName = nameState[1];
    var legacyCount = props.data.legacyArchive && props.data.legacyArchive.objectives
      ? props.data.legacyArchive.objectives.length : 0;
    function saveName() {
      var nextName = name.trim();
      if (!nextName) return;
      props.mutate(function (data) { data.profile.name = nextName; });
    }
    function restore(entry) {
      props.mutate(function (data) {
        var week = D.currentWeek(data);
        if (entry.kind === 'routine') data.routines.push(entry.payload);
        if (entry.kind === 'target') week.targets.push(entry.payload);
        if (entry.kind === 'task') D.attachTask(week, entry.targetId, entry.payload);
        data.trash = data.trash.filter(function (item) { return item.id !== entry.id; });
      });
    }
    return h(Fragment, null,
      h(PageHeader, {
        title: t('Settings & data', 'Cài đặt & dữ liệu'),
        onBack: props.onBack,
        action: h(LanguageToggle, { locale: props.locale, onChange: props.onLocale })
      }),
      h('section', { className: 'settings-card' },
        h('h2', null, t('Profile', 'Hồ sơ')),
        h('label', { className: 'field-label' }, t('Display name', 'Tên hiển thị'),
          h('div', { className: 'field-inline' },
            h('input', {
              className: 'field', value: name, onChange: function (event) { setName(event.target.value); },
              onKeyDown: function (event) { if (event.key === 'Enter') saveName(); }
            }),
            h('button', { className: 'secondary-button small', onClick: saveName }, t('Save', 'Lưu'))))),
      h('section', { className: 'settings-card' },
        h('h2', null, t('Backup', 'Sao lưu')),
        h('p', null, t('Export a file before clearing browser data.', 'Hãy xuất tệp trước khi xóa dữ liệu trình duyệt.')),
        h('div', { className: 'settings-actions' },
          h('button', { className: 'secondary-button', onClick: props.onExport },
            h(Icon, { name: 'download', size: 21 }), t('Export backup', 'Xuất bản sao')),
          h('label', { className: 'secondary-button' },
            h(Icon, { name: 'upload', size: 21 }), t('Restore backup', 'Khôi phục bản sao'),
            h('input', {
              className: 'visually-hidden', type: 'file', accept: '.json,application/json',
              onChange: function (event) {
                props.onImport(event.target.files && event.target.files[0]);
                event.target.value = '';
              }
            }))),
        props.storageError && h('div', { className: 'inline-warning' }, props.storageError)),
      h('section', { className: 'settings-card' },
        h('h2', null, t('Progression rules', 'Quy tắc tiến triển')),
        h('div', { className: 'rule-list' },
          h('span', null, t('Action complete', 'Hoàn tất tác vụ'), h('b', null, '+' + D.XP_RULES.action + ' XP')),
          h('span', null, t('Priority action', 'Tác vụ ưu tiên'), h('b', null, '+' + D.XP_RULES.highAction + ' XP')),
          h('span', null, t('Target complete', 'Hoàn tất mục tiêu'), h('b', null, '+' + D.XP_RULES.targetComplete + ' XP')),
          h('span', null, t('Routine check', 'Đánh dấu thói quen'), h('b', null, '+' + D.XP_RULES.routineCheck + ' XP')))),
      legacyCount > 0 && h('section', { className: 'settings-card legacy-card' },
        h('h2', null, t('Legacy data preserved', 'Dữ liệu cũ đã được giữ lại')),
        h('p', null, t(
          legacyCount + ' original Objective record' + (legacyCount === 1 ? '' : 's') + ' remain inside your backup data.',
          legacyCount + ' mục tiêu cũ vẫn còn trong dữ liệu sao lưu.'))),
      h('section', { className: 'settings-card' },
        h('h2', null, t('Recently deleted', 'Đã xóa gần đây')),
        props.data.trash.length ? h('div', { className: 'trash-list' }, props.data.trash.map(function (entry) {
          return h('div', { key: entry.id, className: 'trash-row' },
            h('div', null, h('strong', null, entry.label), h('small', null, kindLabel(entry.kind))),
            h('button', { className: 'text-button', onClick: function () { restore(entry); } },
              h(Icon, { name: 'restore', size: 20 }), t('Restore', 'Khôi phục')));
        })) : h('p', null, t('Nothing deleted in the last ' + S.TRASH_DAYS + ' days.', 'Không có gì bị xóa trong ' + S.TRASH_DAYS + ' ngày qua.'))));
  }

  function CreateMenu(props) {
    var options = [
      { kind: 'target', icon: 'target', title: t('Target', 'Mục tiêu') },
      { kind: 'task', icon: 'check', title: t('Action', 'Tác vụ') },
      { kind: 'routine', icon: 'repeat', title: t('Routine', 'Thói quen') }
    ];
    return h(Modal, { title: t('Add', 'Thêm'), onClose: props.onClose, className: 'create-sheet' },
      h('div', { className: 'create-options' }, options.map(function (option) {
        return h('button', {
          key: option.kind, onClick: function () { props.onChoose(option.kind); }
        },
          h('span', { className: 'create-icon' }, h(Icon, { name: option.icon, size: 24 })),
          h('div', null, h('strong', null, option.title)),
          h(Icon, { name: 'chevron', size: 21 }));
      })));
  }

  function TargetSheet(props) {
    var editing = Boolean(props.spec.target);
    var source = props.spec.target;
    var titleState = useState(source ? source.title : ''), title = titleState[0], setTitle = titleState[1];
    var descState = useState(source ? source.description : ''), description = descState[0], setDescription = descState[1];
    function commit() {
      var value = title.trim();
      if (!value) return;
      props.mutate(function (data) {
        var week = D.currentWeek(data);
        if (editing) {
          var target = D.findTarget(data, week.id, source.id);
          target.title = value;
          target.description = description.trim();
        } else {
          week.targets.push({
            id: S.uid(), title: value, description: description.trim(), status: 'active', tasks: []
          });
        }
      });
      props.onClose();
    }
    function remove() {
      props.mutate(function (data) {
        var week = D.currentWeek(data);
        var target = D.findTarget(data, week.id, source.id);
        week.targets = week.targets.filter(function (item) { return item.id !== source.id; });
        data.trash.push({
          id: S.uid(), deletedAt: S.now(), kind: 'target', label: target.title,
          weekId: week.id, targetId: null, payload: D.clone(target)
        });
      }, { undoLabel: t('Target removed.', 'Đã bỏ mục tiêu.') });
      props.onClose();
    }
    return h(Modal, {
      title: editing ? t('Edit target', 'Sửa mục tiêu') : t('New target', 'Mục tiêu mới'),
      onClose: props.onClose,
      action: h('button', {
        className: 'sheet-save', disabled: !title.trim(), onClick: commit
      }, editing ? t('Save', 'Lưu') : t('Add', 'Thêm'))
    },
      h('label', { className: 'field-label' }, t('Target', 'Mục tiêu'),
        h('input', {
          className: 'field large-field', autoFocus: true, value: title,
          placeholder: t('Ship the first version', 'Ra mắt phiên bản đầu tiên'),
          onChange: function (event) { setTitle(event.target.value); },
          onKeyDown: function (event) { if (event.key === 'Enter') commit(); }
        })),
      h('label', { className: 'field-label' }, t('Context', 'Ghi chú'),
        h('textarea', {
          className: 'field textarea', value: description,
          placeholder: t('Enough detail to remember why it matters', 'Vài chữ để nhớ vì sao điều này quan trọng'),
          onChange: function (event) { setDescription(event.target.value); }
        })),
      editing && h('button', { className: 'danger-button', onClick: remove },
        h(Icon, { name: 'trash', size: 21 }), t('Remove target from this week', 'Bỏ mục tiêu khỏi tuần này')));
  }

  function TaskSheet(props) {
    var editing = Boolean(props.spec.task);
    var source = props.spec.task;
    var titleState = useState(source ? source.title : ''), title = titleState[0], setTitle = titleState[1];
    var noteState = useState(source ? source.note || '' : ''), note = noteState[0], setNote = noteState[1];
    var targetState = useState(source ? source.targetId || '' : props.spec.presetTargetId || '');
    var targetId = targetState[0], setTargetId = targetState[1];
    var dateState = useState(source ? source.date || '' : props.spec.presetDate || ''), date = dateState[0], setDate = dateState[1];
    var timeState = useState(source ? source.time || '' : ''), time = timeState[0], setTime = timeState[1];
    var priorityState = useState(source ? source.priority : 'normal'), priority = priorityState[0], setPriority = priorityState[1];
    function commit() {
      var value = title.trim();
      if (!value) return;
      props.mutate(function (data) {
        var week = D.currentWeek(data);
        var payload = {
          title: value,
          note: note.trim(),
          priority: priority,
          date: D.isIsoDate(date) ? date : null,
          time: D.isIsoDate(date) && D.isTime(time) ? time : null
        };
        if (editing) {
          var existing = D.findTask(data, source);
          var moved = Object.assign({}, D.bareTask(existing || source), payload);
          D.detachTask(week, source);
          D.attachTask(week, targetId || null, moved);
        } else {
          D.attachTask(week, targetId || null, Object.assign({
            id: S.uid(), done: false, completedAt: null
          }, payload));
        }
      });
      props.onClose();
    }
    function remove() {
      props.mutate(function (data) {
        var week = D.currentWeek(data);
        var record = D.findTask(data, source);
        D.detachTask(week, source);
        data.trash.push({
          id: S.uid(), deletedAt: S.now(), kind: 'task', label: source.title,
          weekId: week.id, targetId: source.targetId || null, payload: D.bareTask(record || source)
        });
      }, { undoLabel: t('Action removed.', 'Đã xóa tác vụ.') });
      props.onClose();
    }
    return h(Modal, {
      title: editing ? t('Edit action', 'Sửa tác vụ') : t('New action', 'Tác vụ mới'),
      onClose: props.onClose,
      action: h('button', {
        className: 'sheet-save', disabled: !title.trim(), onClick: commit
      }, editing ? t('Save', 'Lưu') : t('Add', 'Thêm'))
    },
      h('label', { className: 'field-label' }, t('Action', 'Tác vụ'),
        h('input', {
          className: 'field large-field', autoFocus: true, value: title,
          placeholder: t('What needs to happen?', 'Việc gì cần được làm?'),
          onChange: function (event) { setTitle(event.target.value); },
          onKeyDown: function (event) { if (event.key === 'Enter') commit(); }
        })),
      h('label', { className: 'field-label' }, t('Target', 'Mục tiêu'),
        h('select', {
          className: 'field', value: targetId, onChange: function (event) { setTargetId(event.target.value); }
        },
          h('option', { value: '' }, t('Loose / spontaneous', 'Phát sinh / không thuộc mục tiêu')),
          props.week.targets.map(function (target) {
            return h('option', { key: target.id, value: target.id }, target.title);
          }))),
      h('div', { className: 'field-grid' },
        h('label', { className: 'field-label' }, t('Day · optional', 'Ngày · không bắt buộc'),
          h('input', {
            className: 'field', type: 'date', value: date,
            min: props.week.startDate, max: props.week.endDate,
            onChange: function (event) {
              setDate(event.target.value);
              if (!event.target.value) setTime('');
            }
          })),
        h('label', { className: 'field-label' }, t('Time · optional', 'Giờ · không bắt buộc'),
          h('input', {
            className: 'field', type: 'time', value: time, disabled: !date,
            onChange: function (event) { setTime(event.target.value); }
          }))),
      h('label', { className: 'field-label' }, t('Priority', 'Mức ưu tiên'),
        h('div', { className: 'segmented-control' },
          h('button', {
            className: priority === 'normal' ? 'active' : '',
            onClick: function () { setPriority('normal'); }
          }, t('Normal', 'Thường')),
          h('button', {
            className: priority === 'high' ? 'active' : '',
            onClick: function () { setPriority('high'); }
          }, t('High', 'Cao')))),
      h('label', { className: 'field-label' }, t('Note · optional', 'Ghi chú · không bắt buộc'),
        h('textarea', {
          className: 'field textarea', value: note, placeholder: t('Useful context, not another plan', 'Thông tin cần thiết, không phải một kế hoạch khác'),
          onChange: function (event) { setNote(event.target.value); }
        })),
      editing && h('button', { className: 'danger-button', onClick: remove },
        h(Icon, { name: 'trash', size: 21 }), t('Delete action', 'Xóa tác vụ')));
  }

  function RoutineSheet(props) {
    var editing = Boolean(props.spec.routine);
    var source = props.spec.routine;
    var nameState = useState(source ? source.name : ''), name = nameState[0], setName = nameState[1];
    var typeState = useState(source ? source.recurrence.type : 'weekly'), type = typeState[0], setType = typeState[1];
    var targetState = useState(source ? source.recurrence.target : 3), target = targetState[0], setTarget = targetState[1];
    function commit() {
      var value = name.trim();
      if (!value) return;
      props.mutate(function (data) {
        if (editing) {
          var routine = data.routines.find(function (item) { return item.id === source.id; });
          routine.name = value;
          routine.recurrence = { type: type, target: type === 'daily' ? 7 : Number(target) };
        } else {
          data.routines.push({
            id: S.uid(),
            name: value,
            recurrence: { type: type, target: type === 'daily' ? 7 : Number(target) },
            log: {}
          });
        }
      });
      props.onClose();
    }
    function remove() {
      props.mutate(function (data) {
        var routine = data.routines.find(function (item) { return item.id === source.id; });
        data.routines = data.routines.filter(function (item) { return item.id !== source.id; });
        data.trash.push({
          id: S.uid(), deletedAt: S.now(), kind: 'routine', label: routine.name,
          weekId: null, targetId: null, payload: D.clone(routine)
        });
      }, { undoLabel: t('Routine removed.', 'Đã xóa thói quen.') });
      props.onClose();
    }
    return h(Modal, {
      title: editing ? t('Edit routine', 'Sửa thói quen') : t('New routine', 'Thói quen mới'),
      onClose: props.onClose,
      action: h('button', {
        className: 'sheet-save', disabled: !name.trim(), onClick: commit
      }, editing ? t('Save', 'Lưu') : t('Add', 'Thêm'))
    },
      h('label', { className: 'field-label' }, t('Routine', 'Thói quen'),
        h('input', {
          className: 'field large-field', autoFocus: true, value: name,
          placeholder: t('Read before bed', 'Đọc sách trước khi ngủ'),
          onChange: function (event) { setName(event.target.value); },
          onKeyDown: function (event) { if (event.key === 'Enter') commit(); }
        })),
      h('label', { className: 'field-label' }, t('Cadence', 'Nhịp lặp'),
        h('div', { className: 'segmented-control' },
          h('button', { className: type === 'daily' ? 'active' : '', onClick: function () { setType('daily'); } }, t('Daily', 'Hằng ngày')),
          h('button', { className: type === 'weekly' ? 'active' : '', onClick: function () { setType('weekly'); } }, t('Weekly', 'Hằng tuần')))),
      type === 'weekly' && h('label', { className: 'field-label' }, t('Weekly commitment', 'Số lần mỗi tuần'),
        h('select', {
          className: 'field', value: target, onChange: function (event) { setTarget(Number(event.target.value)); }
        }, [1, 2, 3, 4, 5, 6, 7].map(function (number) {
          return h('option', { key: number, value: number }, t(number + ' time' + (number === 1 ? '' : 's'), number + ' lần'));
        }))),
      editing && h('button', { className: 'danger-button', onClick: remove },
        h(Icon, { name: 'trash', size: 21 }), t('Delete routine', 'Xóa thói quen')));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));

  if ('serviceWorker' in navigator) {
    global.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
}(window));
