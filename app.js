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
      width: props.size || 20,
      height: props.size || 20,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: props.width || 1.8,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true'
    }, (PATHS[props.name] || []).map(function (path, index) {
      return h('path', { d: path, key: index });
    }));
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
          type: 'button', className: 'icon-button bare', onClick: props.onBack, 'aria-label': 'Back'
        }, h(Icon, { name: 'back' })),
        h('div', null,
          props.eyebrow && h('div', { className: 'eyebrow' }, props.eyebrow),
          h('h1', null, props.title),
          props.subtitle && h('p', null, props.subtitle))),
      props.action);
  }

  function EmptyState(props) {
    return h('div', { className: 'empty-state' },
      h('span', { className: 'empty-mark' }, h(Icon, { name: props.icon || 'tree', size: 22 })),
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
          type: 'button', className: 'icon-button bare', onClick: props.onClose, 'aria-label': 'Close'
        }, h(Icon, { name: 'close' })),
        h('h2', null, props.title),
        props.action || h('span', { className: 'sheet-spacer' })),
      h('div', { className: 'modal-body' }, props.children)));
  }

  function BrandMark() {
    return h('div', { className: 'brand-lockup' },
      h('img', { src: 'brand/rootwork-mark.svg', alt: '', className: 'brand-icon' }),
      h('div', { className: 'wordmark' }, h('strong', null, 'ROOT'), h('span', null, 'WORK')));
  }

  function AppTopbar(props) {
    return h('header', { className: 'app-topbar' },
      h(BrandMark),
      h('div', { className: 'topbar-actions' },
        h('button', {
          type: 'button', className: 'identity-chip', onClick: props.onSettings,
          'aria-label': 'Open profile and settings'
        }, h('span', null, props.name), h('b', null, 'Lv.' + props.level)),
        h('button', {
          type: 'button', className: 'icon-button', onClick: props.onMenu,
          'aria-label': 'Open menu', 'aria-expanded': props.menuOpen
        }, h(Icon, { name: 'menu' }))),
      props.menuOpen && h(Fragment, null,
        h('button', {
          className: 'menu-scrim', onClick: props.onMenu, 'aria-label': 'Close menu'
        }),
        h('div', { className: 'menu-popover' },
          h('button', { onClick: props.onArchive }, h(Icon, { name: 'archive' }), 'Archive'),
          h('button', { onClick: props.onSettings }, h(Icon, { name: 'settings' }), 'Settings & data'))));
  }

  var NAV = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'tree', label: 'Tree', icon: 'tree' },
    { id: 'create', label: 'Create', icon: 'plus' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'routine', label: 'Routine', icon: 'repeat' }
  ];

  function BottomNav(props) {
    return h('nav', { className: 'bottom-nav', 'aria-label': 'Primary navigation' },
      NAV.map(function (item) {
        if (item.id === 'create') {
          return h('button', {
            key: item.id, type: 'button', className: 'nav-create', onClick: props.onCreate,
            'aria-label': 'Create'
          }, h(Icon, { name: 'plus', size: 24, width: 2 }), h('span', null, 'Create'));
        }
        return h('button', {
          key: item.id,
          type: 'button',
          className: 'nav-item ' + (props.view === item.id ? 'active' : ''),
          onClick: function () { props.onView(item.id); },
          'aria-current': props.view === item.id ? 'page' : undefined
        }, h(Icon, { name: item.icon, size: 21 }), h('span', null, item.label));
      }));
  }

  function App() {
    var state = useState(null), data = state[0], setData = state[1];
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
    dataRef.current = data;

    useEffect(function () {
      try {
        if (!S.writable()) {
          saveBlocked.current = true;
          setStorageError('Local storage is blocked. Changes will only last for this session.');
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
        setStorageError(error.message || 'Saved data could not be opened. Nothing has been overwritten.');
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
          if (S.nearLimit()) setStorageError('Storage is above 3 MB. Export a backup soon.');
        } catch (error) {
          saveBlocked.current = true;
          setStorageError('Changes could not be saved on this device.');
        }
      }, 80);
      return function () { clearTimeout(timer); };
    }, [data]);

    useEffect(function () {
      return function () { if (toastTimer.current) clearTimeout(toastTimer.current); };
    }, []);

    function showToast(message, action) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message: message, action: action || null });
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
        var afterLevel = D.levelState(D.totalXp(next)).level;
        if (afterLevel > beforeLevel) showToast('Level ' + afterLevel + '. Progress recorded.');
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
          setStorageError(error);
          showToast(error);
          return;
        }
        var next = D.ensureCurrentWeek(imported);
        dataRef.current = next;
        setData(next);
        setStorageError('');
        showToast('Backup restored.');
      });
    }

    if (!data) return h('div', { className: 'loading-screen' }, h(BrandMark), h('span', null, 'Opening your week…'));

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
          openCreate: openCreate
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
        setView: changeView
      };
      if (view === 'tree') return h(TreeView, shared);
      if (view === 'calendar') return h(CalendarView, shared);
      if (view === 'routine') return h(RoutineView, shared);
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

    return h(Fragment, null,
      h('div', { className: 'app-shell' },
        h(AppTopbar, {
          name: data.profile.name,
          level: level.level,
          menuOpen: menuOpen,
          onMenu: function () { setMenuOpen(!menuOpen); },
          onArchive: function () { changeView('archive'); },
          onSettings: function () { changeView('settings'); }
        }),
        storageError && h('div', { className: 'system-notice' }, storageError),
        renderContent()),
      view !== 'archive' && view !== 'settings' && h(BottomNav, {
        view: view,
        onView: changeView,
        onCreate: function () { openCreate(); }
      }),
      renderSheet(),
      toast && h('div', { className: 'toast', role: 'status' },
        h('span', null, toast.message),
        toast.action && h('button', { onClick: toast.action }, 'Undo')));
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

    if (week.phase === 'greeting') {
      var message = D.campaignMessage(week.startDate);
      return h('main', { className: 'start-screen greeting-screen' },
        h('div', { className: 'start-brand' }, h(BrandMark)),
        h('section', { className: 'greeting-copy' },
          h('p', null, D.greeting() + ','),
          h('h1', null, props.data.profile.name + '.'),
          h('div', { className: 'campaign-copy' },
            h('strong', null, message[0]),
            h('span', null, message[1]))),
        h('div', { className: 'start-meta' }, 'Week ' + D.isoWeek(week.startDate) + ' · ' + D.fmtWeekLong(week.startDate)),
        h('button', {
          className: 'primary-button start-cta',
          onClick: function () {
            if (week.targets.length) setPhase('review');
            else if (previous) setPhase('recap');
            else setPhase('active');
          }
        }, 'Start this week', h(Icon, { name: 'chevron' })));
    }

    if (week.phase === 'review') {
      var liveTargets = week.targets;
      function continueFlow() { setPhase(previous ? 'recap' : 'active'); }
      return h('main', { className: 'start-screen review-screen' },
        h('div', { className: 'start-step' }, '01 · Choose the campaign'),
        h('header', { className: 'review-heading' },
          h('h1', null, 'Keep or change your targets?'),
          h('p', null, week.importedLegacy
            ? 'Your existing Rootwork objectives are ready as weekly targets.'
            : 'Last week is a starting point, not a commitment.')),
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
                  h('small', null, metrics.total + ' action' + (metrics.total === 1 ? '' : 's')))),
              h('div', { className: 'review-actions' },
                target.status !== 'removed' && h('button', {
                  className: 'icon-button bare', onClick: function () { props.openTarget(target); },
                  'aria-label': 'Edit ' + target.title
                }, h(Icon, { name: 'edit', size: 18 })),
                h('button', {
                  className: 'text-button',
                  onClick: function () {
                    props.mutate(function (data) {
                      var currentTarget = D.findTarget(data, week.id, target.id);
                      currentTarget.status = currentTarget.status === 'removed' ? 'active' : 'removed';
                    });
                  }
                }, target.status === 'removed' ? 'Keep' : 'Remove')));
          }) : h(EmptyState, {
            title: 'Start with one clear target.',
            text: 'A target is what you want to move this week. Actions come next.',
            action: h('button', {
              className: 'secondary-button', onClick: function () { props.openCreate('target'); }
            }, 'Add a target')
          })),
        h('button', {
          className: 'add-target-line', onClick: function () { props.openCreate('target'); }
        }, h(Icon, { name: 'plus', size: 18 }), 'Add another target'),
        h('div', { className: 'review-footer' },
          h('button', { className: 'secondary-button', onClick: continueFlow }, 'Keep as it is'),
          h('button', { className: 'primary-button', onClick: continueFlow }, 'Continue')));
    }

    if (week.phase === 'recap' && previous) {
      var recap = previous.recap || D.buildRecap(previous, props.data.routines);
      return h('main', { className: 'start-screen recap-screen' },
        h('div', { className: 'start-step' }, '02 · Previous campaign'),
        h('header', { className: 'recap-heading' },
          h('div', null,
            h('span', null, 'Week ' + D.isoWeek(previous.startDate)),
            h('h1', null, 'This is what moved.')),
          h('strong', null, recap.completion + '%')),
        h(ProgressionTree, { week: previous, readonly: true, recap: true }),
        h(RecapStats, { recap: recap }),
        h('button', {
          className: 'primary-button start-cta',
          onClick: function () { setPhase('active'); }
        }, 'Enter Week ' + D.isoWeek(week.startDate), h(Icon, { name: 'chevron' })));
    }

    return h('main', { className: 'start-screen' });
  }

  function RecapStats(props) {
    var recap = props.recap;
    return h('section', { className: 'recap-stats' },
      h('div', null, h('strong', null, '+' + recap.xpEarned.toLocaleString()), h('span', null, 'XP earned')),
      h('div', null, h('strong', null, recap.targetsAdvanced), h('span', null, 'targets advanced')),
      h('div', null, h('strong', null, recap.targetsStalled), h('span', null, 'targets stalled')),
      h('div', null, h('strong', null, recap.routineConsistency + '%'), h('span', null, 'routine consistency')));
  }

  function HomeView(props) {
    var week = props.week;
    var metrics = D.weekMetrics(week, props.data.routines);
    var level = D.levelState(D.totalXp(props.data));
    var tasks = D.weekTasks(week);
    var todayTasks = D.sortTasks(tasks.filter(function (task) {
      return task.date === D.today() && !task.done;
    }));
    var attention = D.attentionItems(week);
    return h(Fragment, null,
      h('section', { className: 'campaign-header' },
        h('div', null,
          h('span', { className: 'eyebrow' }, 'CURRENT CAMPAIGN'),
          h('h1', null, 'Week ' + D.isoWeek(week.startDate)),
          h('p', null, D.fmtWeekRange(week.startDate))),
        h('div', { className: 'campaign-percent' }, metrics.completion + '%')),
      h(Progress, { value: metrics.completion, className: 'campaign-progress' }),
      h('section', { className: 'identity-progress' },
        h('div', { className: 'identity-row' },
          h('strong', null, props.data.profile.name + ' · Lv.' + level.level),
          h('span', null, level.currentXp.toLocaleString() + ' / ' + level.neededXp.toLocaleString() + ' XP')),
        h(Progress, { value: level.percent })),
      h('section', { className: 'home-section today-focus' },
        h('div', { className: 'section-heading' },
          h('div', null, h('span', { className: 'eyebrow' }, 'TODAY'), h('h2', null, 'What matters now')),
          h('button', { className: 'text-button', onClick: function () { props.setView('calendar'); } }, 'Open day')),
        todayTasks.length ? h('div', { className: 'task-list' }, todayTasks.slice(0, 4).map(function (task) {
          return h(ActionRow, {
            key: task.id,
            task: task,
            onToggle: function () { toggleTask(props, task); },
            onOpen: function () { props.openTask(task); }
          });
        })) : h('div', { className: 'quiet-panel' },
          h('strong', null, 'No actions scheduled for today.'),
          h('p', null, 'Unscheduled work is still valid. Pull something in only if it helps.'),
          h('button', { className: 'text-button', onClick: function () { props.setView('tree'); } }, 'Open the tree'))),
      h('section', { className: 'home-section' },
        h('div', { className: 'section-heading' },
          h('div', null, h('span', { className: 'eyebrow' }, 'THIS WEEK'), h('h2', null, 'Targets in motion')),
          h('button', { className: 'text-button', onClick: function () { props.setView('tree'); } }, 'Full tree')),
        week.targets.length ? h('div', { className: 'target-summary-list' }, week.targets.map(function (target) {
          var result = D.targetMetrics(target);
          return h('button', {
            key: target.id, className: 'target-summary', onClick: function () { props.setView('tree'); }
          },
            h('span', { className: 'target-index' }, String(week.targets.indexOf(target) + 1).padStart(2, '0')),
            h('div', null, h('strong', null, target.title), h('small', null, result.done + ' of ' + result.total + ' actions')),
            h('span', { className: 'target-percent' }, result.percent + '%'));
        })) : h(EmptyState, {
          title: 'Your campaign is open.',
          text: 'Add the first target, then define the actions that move it.',
          action: h('button', {
            className: 'primary-button small', onClick: function () { props.openCreate('target'); }
          }, 'Add target')
        })),
      h('section', { className: 'home-section attention-section' },
        h('div', { className: 'section-heading' },
          h('div', null, h('span', { className: 'eyebrow' }, 'SIGNALS'), h('h2', null, 'Needs a decision'))),
        attention.length ? h('div', { className: 'signal-list' }, attention.map(function (item, index) {
          return h('div', { className: 'signal ' + item.tone, key: index },
            h('span', null), h('strong', null, item.label));
        })) : h('div', { className: 'quiet-panel compact' }, 'Nothing is competing for attention.')));
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
        'aria-label': task.done ? 'Mark incomplete' : 'Mark complete',
        'aria-pressed': task.done
      }, task.done && h(Icon, { name: 'check', size: 14, width: 2.8 })),
      h('div', { className: 'action-copy' },
        h('strong', null, task.title),
        h('div', { className: 'action-meta' },
          task.priority === 'high' && h('span', { className: 'priority-tag' }, 'Priority'),
          task.time && h('span', null, task.time),
          h('span', { className: late ? 'late' : '' }, task.date ? D.fmtDate(task.date) : 'Unscheduled'),
          task.targetTitle && h('span', null, task.targetTitle))));
  }

  function TreeView(props) {
    var metrics = D.weekMetrics(props.week, props.data.routines);
    return h(Fragment, null,
      h(PageHeader, {
        eyebrow: 'WEEK ' + D.isoWeek(props.week.startDate),
        title: 'Progression tree',
        subtitle: metrics.done + ' of ' + metrics.total + ' actions complete',
        action: h('button', {
          className: 'icon-button',
          onClick: function () { props.openCreate('target'); },
          'aria-label': 'Add target'
        }, h(Icon, { name: 'plus' }))
      }),
      props.week.targets.length ? h(ProgressionTree, {
        week: props.week,
        onToggle: function (task) { toggleTask(props, task); },
        onOpenTask: props.openTask,
        onAddTask: function (target) { props.openCreate('task', { targetId: target.id }); },
        onEditTarget: props.openTarget
      }) : h(EmptyState, {
        title: 'A tree starts with one target.',
        text: 'Keep it concrete enough that its actions are obvious.',
        action: h('button', {
          className: 'primary-button small', onClick: function () { props.openCreate('target'); }
        }, 'Add target')
      }),
      h(LooseActions, props));
  }

  function ProgressionTree(props) {
    var week = props.week;
    return h('section', {
      className: 'progression-tree ' + (props.recap ? 'recap-tree' : '') + (props.compact ? ' compact-tree' : '')
    },
      h('div', { className: 'week-node' },
        h('span', null, 'WEEK'),
        h('strong', null, D.isoWeek(week.startDate)),
        h('small', null, D.fmtWeekRange(week.startDate))),
      h('div', { className: 'tree-trunk', 'aria-hidden': 'true' }),
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
                h('span', { className: 'target-node-kicker' }, 'TARGET ' + String(targetIndex + 1).padStart(2, '0')),
                h('strong', null, target.title),
                target.description && h('small', null, target.description)),
              h('div', { className: 'target-node-progress' },
                h('strong', null, metrics.percent + '%'),
                h('span', null, metrics.done + '/' + metrics.total))),
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
                    'aria-label': task.done ? 'Completed' : 'Incomplete'
                  }, task.done && h(Icon, { name: 'check', size: 12, width: 2.8 })),
                  h('button', {
                    className: 'tree-action-copy',
                    disabled: props.readonly,
                    onClick: props.onOpenTask ? function () { props.onOpenTask(task); } : undefined
                  },
                    h('strong', null, task.title),
                    h('small', null, task.date ? D.fmtDate(task.date) + (task.time ? ' · ' + task.time : '') : 'Unscheduled')));
              }) : h('div', { className: 'tree-empty-action' }, 'No actions yet'),
              props.onAddTask && h('button', {
                className: 'tree-add-action', onClick: function () { props.onAddTask(target); }
              }, h(Icon, { name: 'plus', size: 16 }), 'Add action')));
        })));
  }

  function LooseActions(props) {
    var tasks = D.sortTasks(D.weekTasks(props.week).filter(function (task) { return task.loose; }));
    return h('section', { className: 'loose-section' },
      h('div', { className: 'section-heading' },
        h('div', null, h('span', { className: 'eyebrow' }, 'LOOSE WORK'), h('h2', null, 'Spontaneous actions')),
        h('button', {
          className: 'text-button', onClick: function () { props.openCreate('task', {}); }
        }, 'Add action')),
      tasks.length ? h('div', { className: 'task-list' }, tasks.map(function (task) {
        return h(ActionRow, {
          key: task.id,
          task: task,
          onToggle: function () { toggleTask(props, task); },
          onOpen: function () { props.openTask(task); }
        });
      })) : h('div', { className: 'quiet-panel compact' }, 'Nothing loose. Add work here when it does not belong to a target.'));
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
        eyebrow: 'WEEK ' + D.isoWeek(props.week.startDate),
        title: 'Calendar',
        subtitle: 'Schedule only what benefits from a day.',
        action: h('button', {
          className: 'icon-button',
          onClick: function () { props.openCreate('task', { date: picked }); },
          'aria-label': 'Add action'
        }, h(Icon, { name: 'plus' }))
      }),
      h('nav', { className: 'day-strip', 'aria-label': 'Days this week' },
        dates.map(function (date, index) {
          return h('button', {
            key: date,
            className: 'day-button ' + (date === picked ? 'active ' : '') + (date === D.today() ? 'today' : ''),
            onClick: function () { setPicked(date); }
          }, h('span', null, D.DOW[index]), h('strong', null, D.parseYmd(date).getDate()));
        })),
      h('div', { className: 'agenda-date' },
        h('h2', null, picked === D.today() ? 'Today' : D.fmtDateFull(picked)),
        h('span', null, tasks.filter(function (task) { return task.done; }).length + '/' + tasks.length + ' complete')),
      h(AgendaSection, {
        title: 'Timed',
        empty: 'No fixed-time actions.',
        tasks: timed,
        props: props
      }),
      h(AgendaSection, {
        title: 'Any time',
        empty: 'No flexible actions on this day.',
        tasks: flexible,
        props: props
      }),
      h('section', { className: 'agenda-section unscheduled-agenda' },
        h('div', { className: 'agenda-section-title' },
          h('h3', null, 'Unscheduled'),
          h('span', null, unscheduled.length)),
        unscheduled.length ? h('div', { className: 'task-list' }, unscheduled.map(function (task) {
          return h(ActionRow, {
            key: task.id,
            task: task,
            onToggle: function () { toggleTask(props, task); },
            onOpen: function () { props.openTask(task); }
          });
        })) : h('div', { className: 'quiet-panel compact' }, 'No actions waiting for a day.')));
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
        eyebrow: 'CONSISTENCY',
        title: 'Routine',
        subtitle: D.routineConsistency(props.data.routines, props.week.startDate) + '% of this week’s commitment',
        action: h('button', {
          className: 'icon-button',
          onClick: function () { props.openCreate('routine'); },
          'aria-label': 'Add routine'
        }, h(Icon, { name: 'plus' }))
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
                  ? 'Daily' : snapshot.target + ' times weekly')),
              h('div', { className: 'routine-score' },
                h('strong', null, snapshot.hits + '/' + snapshot.target),
                streak > 0 && h('span', null, streak + 'w streak'))),
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
                  'aria-label': (on ? 'Remove ' : 'Complete ') + routine.name + ' on ' + D.fmtDateFull(date)
                }, h('span', null, D.DOW[index]), h('i', null, on && h(Icon, { name: 'check', size: 12, width: 2.8 })));
              })),
            h(Progress, { value: snapshot.percent }));
        })) : h(EmptyState, {
        icon: 'repeat',
        title: 'Routine protects the baseline.',
        text: 'Track recurring behavior separately from weekly targets.',
        action: h('button', {
          className: 'primary-button small', onClick: function () { props.openCreate('routine'); }
        }, 'Add routine')
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
          eyebrow: 'ARCHIVE',
          title: 'Week ' + D.isoWeek(selected.startDate),
          subtitle: D.fmtWeekLong(selected.startDate),
          onBack: function () { props.setSelectedId(null); }
        }),
        h('div', { className: 'archive-hero' },
          h('strong', null, recap.completion + '%'),
          h('span', null, '+' + recap.xpEarned.toLocaleString() + ' XP'),
          h(Progress, { value: recap.completion })),
        h(ProgressionTree, { week: selected, readonly: true }),
        h(RecapStats, { recap: recap }));
    }
    var trend = D.archiveTrend(props.data, 8);
    return h(Fragment, null,
      h(PageHeader, {
        eyebrow: 'PROGRESSION',
        title: 'Archive',
        subtitle: completed.length + ' completed campaign' + (completed.length === 1 ? '' : 's'),
        onBack: props.onBack
      }),
      trend.length > 1 && h('section', { className: 'trend-card' },
        h('div', { className: 'section-heading' },
          h('div', null, h('span', { className: 'eyebrow' }, 'LAST ' + trend.length + ' WEEKS'), h('h2', null, 'Execution trend'))),
        h('div', { className: 'trend-bars' }, trend.map(function (item) {
          return h('div', { className: 'trend-bar-wrap', key: item.week },
            h('div', { className: 'trend-bar' }, h('span', { style: { height: item.completion + '%' } })),
            h('small', null, 'W' + item.week));
        }))),
      completed.length ? h('div', { className: 'archive-list' }, completed.map(function (week) {
        var recap = week.recap || D.buildRecap(week, []);
        return h('button', {
          className: 'archive-row', key: week.id, onClick: function () { props.setSelectedId(week.id); }
        },
          h('div', { className: 'archive-week' },
            h('strong', null, 'Week ' + D.isoWeek(week.startDate)),
            h('span', null, D.fmtWeekRange(week.startDate))),
          h('div', { className: 'archive-result' },
            h('strong', null, recap.completion + '%'),
            h('span', null, '+' + recap.xpEarned.toLocaleString() + ' XP')),
          h(Icon, { name: 'chevron', size: 18 }));
      })) : h(EmptyState, {
        icon: 'archive',
        title: 'History begins after this week.',
        text: 'Completed campaigns will remain here as read-only records.'
      }));
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
        eyebrow: 'ROOTWORK',
        title: 'Settings & data',
        subtitle: 'Local-first. Account-free. No tracking.',
        onBack: props.onBack
      }),
      h('section', { className: 'settings-card' },
        h('h2', null, 'Profile'),
        h('label', { className: 'field-label' }, 'Display name',
          h('div', { className: 'field-inline' },
            h('input', {
              className: 'field', value: name, onChange: function (event) { setName(event.target.value); },
              onKeyDown: function (event) { if (event.key === 'Enter') saveName(); }
            }),
            h('button', { className: 'secondary-button small', onClick: saveName }, 'Save')))),
      h('section', { className: 'settings-card' },
        h('h2', null, 'Backup'),
        h('p', null, 'Your data lives in this browser. Export a file before moving domains or clearing site data.'),
        h('div', { className: 'settings-actions' },
          h('button', { className: 'secondary-button', onClick: props.onExport },
            h(Icon, { name: 'download', size: 18 }), 'Export backup'),
          h('label', { className: 'secondary-button' },
            h(Icon, { name: 'upload', size: 18 }), 'Restore backup',
            h('input', {
              className: 'visually-hidden', type: 'file', accept: '.json,application/json',
              onChange: function (event) {
                props.onImport(event.target.files && event.target.files[0]);
                event.target.value = '';
              }
            }))),
        props.storageError && h('div', { className: 'inline-warning' }, props.storageError)),
      h('section', { className: 'settings-card' },
        h('h2', null, 'Progression rules'),
        h('div', { className: 'rule-list' },
          h('span', null, 'Action complete', h('b', null, '+' + D.XP_RULES.action + ' XP')),
          h('span', null, 'Priority action', h('b', null, '+' + D.XP_RULES.highAction + ' XP')),
          h('span', null, 'Target complete', h('b', null, '+' + D.XP_RULES.targetComplete + ' XP')),
          h('span', null, 'Routine check', h('b', null, '+' + D.XP_RULES.routineCheck + ' XP')))),
      legacyCount > 0 && h('section', { className: 'settings-card legacy-card' },
        h('h2', null, 'Legacy data preserved'),
        h('p', null, legacyCount + ' original Objective record' + (legacyCount === 1 ? '' : 's') +
          ', including Key Results and metrics, remain inside your backup data.')),
      h('section', { className: 'settings-card' },
        h('h2', null, 'Recently deleted'),
        props.data.trash.length ? h('div', { className: 'trash-list' }, props.data.trash.map(function (entry) {
          return h('div', { key: entry.id, className: 'trash-row' },
            h('div', null, h('strong', null, entry.label), h('small', null, entry.kind)),
            h('button', { className: 'text-button', onClick: function () { restore(entry); } },
              h(Icon, { name: 'restore', size: 16 }), 'Restore'));
        })) : h('p', null, 'Nothing deleted in the last ' + S.TRASH_DAYS + ' days.')));
  }

  function CreateMenu(props) {
    var options = [
      { kind: 'target', icon: 'target', title: 'Target', text: 'What should move this week?' },
      { kind: 'task', icon: 'check', title: 'Action', text: 'Targeted or completely loose.' },
      { kind: 'routine', icon: 'repeat', title: 'Routine', text: 'Recurring behavior that keeps the baseline.' }
    ];
    return h(Modal, { title: 'Create', onClose: props.onClose, className: 'create-sheet' },
      h('div', { className: 'create-options' }, options.map(function (option) {
        return h('button', {
          key: option.kind, onClick: function () { props.onChoose(option.kind); }
        },
          h('span', { className: 'create-icon' }, h(Icon, { name: option.icon })),
          h('div', null, h('strong', null, option.title), h('small', null, option.text)),
          h(Icon, { name: 'chevron', size: 18 }));
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
      }, { undoLabel: 'Target removed.' });
      props.onClose();
    }
    return h(Modal, {
      title: editing ? 'Edit target' : 'New target',
      onClose: props.onClose,
      action: h('button', {
        className: 'sheet-save', disabled: !title.trim(), onClick: commit
      }, editing ? 'Save' : 'Add')
    },
      h('label', { className: 'field-label' }, 'Target',
        h('input', {
          className: 'field large-field', autoFocus: true, value: title,
          placeholder: 'Ship the first version',
          onChange: function (event) { setTitle(event.target.value); },
          onKeyDown: function (event) { if (event.key === 'Enter') commit(); }
        })),
      h('label', { className: 'field-label' }, 'Context',
        h('textarea', {
          className: 'field textarea', value: description,
          placeholder: 'Enough detail to remember why it matters',
          onChange: function (event) { setDescription(event.target.value); }
        })),
      editing && h('button', { className: 'danger-button', onClick: remove },
        h(Icon, { name: 'trash', size: 18 }), 'Remove target from this week'));
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
      }, { undoLabel: 'Action removed.' });
      props.onClose();
    }
    return h(Modal, {
      title: editing ? 'Edit action' : 'New action',
      onClose: props.onClose,
      action: h('button', {
        className: 'sheet-save', disabled: !title.trim(), onClick: commit
      }, editing ? 'Save' : 'Add')
    },
      h('label', { className: 'field-label' }, 'Action',
        h('input', {
          className: 'field large-field', autoFocus: true, value: title,
          placeholder: 'What needs to happen?',
          onChange: function (event) { setTitle(event.target.value); },
          onKeyDown: function (event) { if (event.key === 'Enter') commit(); }
        })),
      h('label', { className: 'field-label' }, 'Target',
        h('select', {
          className: 'field', value: targetId, onChange: function (event) { setTargetId(event.target.value); }
        },
          h('option', { value: '' }, 'Loose / spontaneous'),
          props.week.targets.map(function (target) {
            return h('option', { key: target.id, value: target.id }, target.title);
          }))),
      h('div', { className: 'field-grid' },
        h('label', { className: 'field-label' }, 'Day · optional',
          h('input', {
            className: 'field', type: 'date', value: date,
            min: props.week.startDate, max: props.week.endDate,
            onChange: function (event) {
              setDate(event.target.value);
              if (!event.target.value) setTime('');
            }
          })),
        h('label', { className: 'field-label' }, 'Time · optional',
          h('input', {
            className: 'field', type: 'time', value: time, disabled: !date,
            onChange: function (event) { setTime(event.target.value); }
          }))),
      h('label', { className: 'field-label' }, 'Priority',
        h('div', { className: 'segmented-control' },
          h('button', {
            className: priority === 'normal' ? 'active' : '',
            onClick: function () { setPriority('normal'); }
          }, 'Normal'),
          h('button', {
            className: priority === 'high' ? 'active' : '',
            onClick: function () { setPriority('high'); }
          }, 'High'))),
      h('label', { className: 'field-label' }, 'Note · optional',
        h('textarea', {
          className: 'field textarea', value: note, placeholder: 'Useful context, not another plan',
          onChange: function (event) { setNote(event.target.value); }
        })),
      editing && h('button', { className: 'danger-button', onClick: remove },
        h(Icon, { name: 'trash', size: 18 }), 'Delete action'));
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
      }, { undoLabel: 'Routine removed.' });
      props.onClose();
    }
    return h(Modal, {
      title: editing ? 'Edit routine' : 'New routine',
      onClose: props.onClose,
      action: h('button', {
        className: 'sheet-save', disabled: !name.trim(), onClick: commit
      }, editing ? 'Save' : 'Add')
    },
      h('label', { className: 'field-label' }, 'Routine',
        h('input', {
          className: 'field large-field', autoFocus: true, value: name,
          placeholder: 'Read before bed',
          onChange: function (event) { setName(event.target.value); },
          onKeyDown: function (event) { if (event.key === 'Enter') commit(); }
        })),
      h('label', { className: 'field-label' }, 'Cadence',
        h('div', { className: 'segmented-control' },
          h('button', { className: type === 'daily' ? 'active' : '', onClick: function () { setType('daily'); } }, 'Daily'),
          h('button', { className: type === 'weekly' ? 'active' : '', onClick: function () { setType('weekly'); } }, 'Weekly'))),
      type === 'weekly' && h('label', { className: 'field-label' }, 'Weekly commitment',
        h('select', {
          className: 'field', value: target, onChange: function (event) { setTarget(Number(event.target.value)); }
        }, [1, 2, 3, 4, 5, 6, 7].map(function (number) {
          return h('option', { key: number, value: number }, number + ' time' + (number === 1 ? '' : 's'));
        }))),
      editing && h('button', { className: 'danger-button', onClick: remove },
        h(Icon, { name: 'trash', size: 18 }), 'Delete routine'));
  }

  ReactDOM.createRoot(document.getElementById('root')).render(h(App));

  if ('serviceWorker' in navigator) {
    global.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
}(window));
