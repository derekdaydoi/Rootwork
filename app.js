/* Rootwork — mockup-aligned weekly execution UI. */
(function (global) {
  'use strict';

  var React = global.React;
  var ReactDOM = global.ReactDOM;
  var D = global.RootworkDomain;
  var S = global.RootworkStore;
  var h = React.createElement;
  var useState = React.useState;
  var useEffect = React.useEffect;
  var useRef = React.useRef;

  function pct(done, total) { return total ? Math.round(done * 100 / total) : 0; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }
  function parseYmd(value) {
    var p = String(value || '').split('-').map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1, 12, 0, 0, 0);
  }
  function mondayIndex(jsDay) { return (jsDay + 6) % 7; }

  function allTasks(week) {
    var out = [];
    (week.targets || []).forEach(function (target) {
      (target.tasks || []).forEach(function (task) {
        out.push(Object.assign({}, task, { targetId: target.id, targetTitle: target.title, loose: false }));
      });
    });
    (week.looseTasks || []).forEach(function (task) {
      out.push(Object.assign({}, task, { targetId: null, targetTitle: '', loose: true }));
    });
    return out;
  }

  function goalStats(target) {
    var tasks = target.tasks || [];
    var done = tasks.filter(function (x) { return x.done; }).length;
    return { total: tasks.length, done: done, percent: pct(done, tasks.length) };
  }

  function icon(kind) {
    var map = {
      dashboard: '▦',
      goals: '◎',
      calendar: '□',
      progress: '▥',
      more: '•••',
      bell: '♧',
      plus: '+',
      back: '‹',
      next: '›',
      check: '✓',
      target: '◎',
      routine: '↻',
      task: '≡',
      close: '×'
    };
    return map[kind] || '•';
  }

  function App() {
    var savedLocale = null;
    try { savedLocale = global.localStorage.getItem('rootwork:locale'); } catch (error) {}
    var localeState = useState(savedLocale === 'en' ? 'en' : 'vi');
    var locale = localeState[0], setLocale = localeState[1];
    var dataState = useState(null);
    var data = dataState[0], setData = dataState[1];
    var viewState = useState('dashboard');
    var view = viewState[0], setView = viewState[1];
    var launchState = useState(true);
    var launch = launchState[0], setLaunch = launchState[1];
    var modalState = useState(null);
    var modal = modalState[0], setModal = modalState[1];
    var toastState = useState('');
    var toast = toastState[0], setToast = toastState[1];
    var dataRef = useRef(null);

    function t(en, vi) { return locale === 'vi' ? vi : en; }

    useEffect(function () {
      var next;
      try {
        next = S.load();
        if (!next) next = S.empty();
        next = D.ensureCurrentWeek(next);
      } catch (error) {
        next = D.ensureCurrentWeek(S.empty());
      }
      var week = D.currentWeek(next);
      if (week && week.phase !== 'active') {
        week.phase = 'active';
        week.status = 'active';
        week.startedAt = week.startedAt || S.now();
        week.targets = (week.targets || []).filter(function (x) { return x.status !== 'removed'; });
      }
      dataRef.current = next;
      setData(next);
      try { S.save(next); } catch (error) {}
      var timer = setTimeout(function () { setLaunch(false); }, 1700);
      return function () { clearTimeout(timer); };
    }, []);

    function mutate(fn, message) {
      if (!dataRef.current) return;
      var next = D.clone(dataRef.current);
      fn(next);
      next.meta = Object.assign({}, next.meta || {}, { updatedAt: S.now() });
      next.schemaVersion = S.SCHEMA;
      dataRef.current = next;
      setData(next);
      try { S.save(next); } catch (error) {}
      if (message) {
        setToast(message);
        setTimeout(function () { setToast(''); }, 2200);
      }
    }

    function changeLocale(next) {
      setLocale(next);
      if (S.setLocale) S.setLocale(next);
    }

    function toggleTask(taskId) {
      mutate(function (next) {
        var week = D.currentWeek(next);
        var task = null;
        (week.targets || []).some(function (target) {
          task = (target.tasks || []).find(function (item) { return item.id === taskId; }) || null;
          return Boolean(task);
        });
        if (!task) task = (week.looseTasks || []).find(function (item) { return item.id === taskId; }) || null;
        if (!task) return;
        task.done = !task.done;
        task.completedAt = task.done ? S.now() : null;
      });
    }

    function addTarget(title, description) {
      mutate(function (next) {
        var week = D.currentWeek(next);
        week.targets.push({
          id: S.uid(),
          title: title,
          description: description || '',
          status: 'active',
          tasks: []
        });
      }, t('Goal added', 'Đã thêm mục tiêu'));
    }

    function addTask(payload) {
      mutate(function (next) {
        var week = D.currentWeek(next);
        var task = {
          id: S.uid(),
          title: payload.title,
          note: '',
          priority: payload.priority === 'high' ? 'high' : 'normal',
          done: false,
          date: payload.date || null,
          time: null,
          completedAt: null
        };
        D.attachTask(week, payload.targetId || null, task);
      }, t('Weekly task added', 'Đã thêm tác vụ tuần'));
    }

    function addRoutine(name, target) {
      mutate(function (next) {
        next.routines.push({
          id: S.uid(),
          name: name,
          recurrence: { type: 'weekly', target: Math.max(1, Math.min(7, Number(target) || 3)) },
          log: {}
        });
      }, t('Routine added', 'Đã thêm thói quen'));
    }

    if (!data) return h('div', { className: 'rw-loading' });

    var week = D.currentWeek(data);
    var shared = {
      data: data,
      week: week,
      locale: locale,
      t: t,
      onToggleTask: toggleTask,
      onAddTarget: function () { setModal({ type: 'target' }); },
      onAddTask: function (targetId, date) { setModal({ type: 'task', targetId: targetId || '', date: date || '' }); },
      onAddRoutine: function () { setModal({ type: 'routine' }); },
      onSettings: function () { setModal({ type: 'settings' }); },
      setView: setView
    };

    return h(React.Fragment, null,
      launch && h(Launch, { t: t }),
      h('main', { className: 'rw-shell' },
        h(Topbar, { data: data, t: t, onSettings: shared.onSettings }),
        view === 'dashboard' && h(Dashboard, shared),
        view === 'goals' && h(Goals, shared),
        view === 'calendar' && h(Calendar, shared),
        view === 'progress' && h(ProgressView, shared)
      ),
      h(BottomNav, { view: view, setView: setView, t: t, onAdd: function () { setModal({ type: 'quick' }); } }),
      modal && h(ModalHost, {
        modal: modal,
        data: data,
        week: week,
        locale: locale,
        t: t,
        close: function () { setModal(null); },
        addTarget: addTarget,
        addTask: addTask,
        addRoutine: addRoutine,
        changeLocale: changeLocale,
        replaceModal: setModal
      }),
      toast && h('div', { className: 'rw-toast' }, toast)
    );
  }

  function Launch(props) {
    return h('div', { className: 'rw-launch' },
      h('div', { className: 'rw-launch-lockup' },
        h('img', { src: 'brand/rootwork-logo.png', alt: 'Rootwork', className: 'rw-launch-logo' }),
        h('p', null, props.t('Small steps. A better you.', 'Nhỏ hôm nay, lớn ngày mai'))
      )
    );
  }

  function Topbar(props) {
    var initial = (props.data.profile && props.data.profile.name ? props.data.profile.name : 'R').trim().charAt(0).toUpperCase();
    return h('header', { className: 'rw-topbar' },
      h('div', { className: 'rw-brand' },
        h('img', { src: 'brand/rootwork-mark.png', alt: '' }),
        h('div', null,
          h('strong', null, 'Rootwork'),
          h('small', null, props.t('Small today, bigger tomorrow', 'Nhỏ hôm nay, lớn ngày mai'))
        )
      ),
      h('div', { className: 'rw-top-actions' },
        h('button', { className: 'rw-icon-btn', 'aria-label': props.t('Notifications', 'Thông báo') }, icon('bell')),
        h('button', { className: 'rw-avatar', onClick: props.onSettings, 'aria-label': props.t('Settings', 'Cài đặt') }, initial)
      )
    );
  }

  function SectionTitle(props) {
    return h('div', { className: 'rw-section-title' },
      h('h2', null, props.title),
      props.action && h('button', { onClick: props.action }, props.actionLabel)
    );
  }

  function Dashboard(props) {
    var tasks = allTasks(props.week);
    var done = tasks.filter(function (x) { return x.done; }).length;
    var completion = pct(done, tasks.length);
    var targets = props.week.targets || [];
    var now = new Date();
    var day = mondayIndex(now.getDay());
    var elapsed = Math.min(100, Math.round(((day + 1) / 7) * 100));
    var pace = elapsed ? completion / elapsed : completion / 15;
    var ability = pace >= .9 ? props.t('High', 'Cao') : pace >= .62 ? props.t('Medium', 'Trung bình') : props.t('At risk', 'Rủi ro');
    var onTrack = 0, atRisk = 0;
    targets.forEach(function (target) {
      var s = goalStats(target);
      if (s.percent >= elapsed - 15 || s.percent >= 70) onTrack += 1; else atRisk += 1;
    });
    var dates = D.weekDates(props.week.startDate);
    var daily = dates.map(function (date) {
      var ds = tasks.filter(function (x) { return x.date === date; });
      return pct(ds.filter(function (x) { return x.done; }).length, ds.length);
    });

    return h('div', { className: 'rw-page rw-dashboard' },
      h('div', { className: 'rw-page-heading' },
        h('h1', null, props.t('Dashboard', 'Dashboard')),
        h('p', null, props.t('Focus today, become a better version tomorrow.', 'Tập trung hôm nay, một phiên bản tốt hơn ngày mai.'))
      ),
      h('section', { className: 'rw-hero-grid' },
        h('article', { className: 'rw-metric-card rw-big-metric' },
          h('span', null, props.t('Weekly completion', 'Tỷ lệ hoàn thành tuần')),
          h('strong', null, completion + '%'),
          h('div', { className: 'rw-progress' }, h('i', { style: { width: completion + '%' } }))
        ),
        h('article', { className: 'rw-metric-card rw-ability-card' },
          h('span', null, props.t('Chance of finishing week', 'Khả năng hoàn thành tuần')),
          h('div', { className: 'rw-ability' }, h('b', null, '▥'), h('strong', null, ability)),
          h('small', null, props.t('Based on current execution pace', 'Dựa trên tiến độ hiện tại'))
        )
      ),
      h('section', { className: 'rw-stat-grid' },
        stat('◎', targets.length, props.t('Active goals', 'Mục tiêu đang chạy')),
        stat('≡', tasks.length, props.t('Weekly tasks', 'Tác vụ tuần')),
        stat('◐', onTrack, props.t('On track', 'On track')),
        stat('●', atRisk, props.t('At risk', 'At risk'), 'risk')
      ),
      h('section', { className: 'rw-card rw-chart-card' },
        h('h3', null, props.t('Daily progress (this week)', 'Tiến độ theo ngày (tuần này)')),
        h('div', { className: 'rw-bar-chart' }, daily.map(function (value, index) {
          return h('div', { className: 'rw-bar-col', key: index },
            h('span', { className: 'rw-bar-track' }, h('i', { style: { height: Math.max(5, value) + '%' } })),
            h('small', null, props.locale === 'vi' ? ['T2','T3','T4','T5','T6','T7','CN'][index] : ['M','T','W','T','F','S','S'][index])
          );
        }))
      ),
      h(SectionTitle, {
        title: props.t('Goals in motion', 'Mục tiêu đang chạy'),
        actionLabel: props.t('See all', 'Xem tất cả'),
        action: function () { props.setView('goals'); }
      }),
      targets.length ? h('div', { className: 'rw-goal-summary-list' }, targets.map(function (target, index) {
        var s = goalStats(target);
        return h('button', { className: 'rw-goal-summary', key: target.id, onClick: function () { props.setView('goals'); } },
          h('span', { className: 'rw-goal-icon' }, goalGlyph(index)),
          h('div', { className: 'rw-goal-copy' },
            h('strong', null, target.title),
            h('div', { className: 'rw-progress small' }, h('i', { style: { width: s.percent + '%' } }))
          ),
          h('span', { className: 'rw-goal-fraction' }, s.done + '/' + s.total),
          h('b', null, s.percent + '%')
        );
      })) : h(EmptyState, {
        title: props.t('Create your first goal', 'Tạo mục tiêu đầu tiên'),
        text: props.t('Then break it directly into weekly tasks.', 'Sau đó đi thẳng từ mục tiêu xuống tác vụ tuần.'),
        action: props.onAddTarget,
        actionText: props.t('Add goal', 'Thêm mục tiêu')
      })
    );
  }

  function stat(glyph, value, label, tone) {
    return h('article', { className: 'rw-stat ' + (tone || '') },
      h('span', null, glyph), h('strong', null, value), h('small', null, label));
  }

  function goalGlyph(index) {
    return ['▣','♥','▥','◆','◈','●'][index % 6];
  }

  function Goals(props) {
    var targets = props.week.targets || [];
    return h('div', { className: 'rw-page' },
      h('div', { className: 'rw-page-heading rw-heading-action' },
        h('div', null,
          h('h1', null, props.t('Weekly goals', 'Mục tiêu tuần')),
          h('p', null, props.t('Turn goals directly into concrete actions for this week.', 'Biến mục tiêu thành hành động cụ thể trong tuần này.'))
        ),
        h('button', { className: 'rw-circle-add', onClick: props.onAddTarget }, '+')
      ),
      targets.length ? h('div', { className: 'rw-goal-card-list' }, targets.map(function (target, index) {
        var s = goalStats(target);
        return h('article', { className: 'rw-goal-card', key: target.id },
          h('header', null,
            h('span', { className: 'rw-goal-icon large' }, goalGlyph(index)),
            h('div', { className: 'rw-goal-head-copy' },
              h('strong', null, target.title),
              target.description && h('small', null, target.description)
            ),
            h('div', { className: 'rw-goal-score' }, h('b', null, s.done + '/' + s.total), h('div', { className: 'rw-progress tiny' }, h('i', { style: { width: s.percent + '%' } })))
          ),
          h('div', { className: 'rw-task-list' },
            (target.tasks || []).map(function (task) {
              return h(TaskRow, { key: task.id, task: task, targetTitle: target.title, t: props.t, onToggle: props.onToggleTask });
            })
          ),
          h('button', { className: 'rw-add-task-row', onClick: function () { props.onAddTask(target.id); } },
            h('span', null, '+'), props.t('Add weekly task', 'Thêm tác vụ tuần')
          )
        );
      })) : h(EmptyState, {
        title: props.t('No goals yet', 'Chưa có mục tiêu'),
        text: props.t('Start with one outcome. Weekly tasks come immediately after it.', 'Bắt đầu bằng một kết quả muốn đạt. Tác vụ tuần nằm ngay bên dưới.'),
        action: props.onAddTarget,
        actionText: props.t('Create goal', 'Tạo mục tiêu')
      }),
      (props.week.looseTasks || []).length > 0 && h('section', { className: 'rw-card rw-loose' },
        h(SectionTitle, { title: props.t('Loose weekly tasks', 'Tác vụ tuần độc lập') }),
        props.week.looseTasks.map(function (task) {
          return h(TaskRow, { key: task.id, task: task, targetTitle: '', t: props.t, onToggle: props.onToggleTask });
        })
      ),
      h('button', { className: 'rw-floating-add', onClick: function () { props.onAddTask(''); } }, '+')
    );
  }

  function TaskRow(props) {
    var due = props.task.date ? parseYmd(props.task.date) : null;
    var meta = due ? (due.getDate() + '/' + (due.getMonth() + 1)) : props.t('Any day', 'Linh hoạt');
    return h('div', { className: 'rw-task-row ' + (props.task.done ? 'done' : '') },
      h('button', {
        className: 'rw-check ' + (props.task.done ? 'checked' : ''),
        onClick: function () { props.onToggle(props.task.id); },
        'aria-label': props.task.done ? props.t('Mark incomplete', 'Đánh dấu chưa xong') : props.t('Mark complete', 'Hoàn thành')
      }, props.task.done ? '✓' : ''),
      h('div', { className: 'rw-task-copy' },
        h('strong', null, props.task.title),
        props.task.note && h('small', null, props.task.note)
      ),
      h('span', { className: 'rw-task-date' }, meta)
    );
  }

  function Calendar(props) {
    var today = D.today();
    var initial = parseYmd(today);
    var monthState = useState(new Date(initial.getFullYear(), initial.getMonth(), 1, 12));
    var month = monthState[0], setMonth = monthState[1];
    var pickedState = useState(today);
    var picked = pickedState[0], setPicked = pickedState[1];
    var filterState = useState('all');
    var filter = filterState[0], setFilter = filterState[1];

    var monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    var offset = mondayIndex(monthStart.getDay());
    var gridStart = new Date(monthStart); gridStart.setDate(monthStart.getDate() - offset);
    var cells = [];
    for (var i = 0; i < 42; i++) {
      var d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
      cells.push(d);
    }

    var everyTask = [];
    (props.data.weeks || []).forEach(function (week) {
      allTasks(week).forEach(function (task) { everyTask.push(Object.assign({}, task, { weekId: week.id, readonly: week.status === 'complete' })); });
    });
    var pickedTasks = everyTask.filter(function (x) { return x.date === picked; });
    var routines = props.data.routines || [];
    var pickedRoutines = routines.filter(function (r) { return Boolean(r.log && r.log[picked]); });

    function marks(date) {
      var key = ymd(date);
      var taskCount = everyTask.filter(function (x) { return x.date === key; }).length;
      var routineCount = routines.filter(function (r) { return r.log && r.log[key]; }).length;
      return { taskCount: taskCount, routineCount: routineCount };
    }

    var selectedRows = [];
    if (filter !== 'routines') selectedRows = selectedRows.concat(pickedTasks.map(function (task) {
      return { type: 'task', task: task, title: task.title, sub: task.targetTitle || props.t('Weekly task', 'Tác vụ tuần') };
    }));
    if (filter !== 'targets') selectedRows = selectedRows.concat(pickedRoutines.map(function (routine) {
      return { type: 'routine', routine: routine, title: routine.name, sub: props.t('Routine', 'Thói quen') };
    }));

    var selectedDate = parseYmd(picked);
    var dayNames = props.locale === 'vi' ? ['T2','T3','T4','T5','T6','T7','CN'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var monthLabel = selectedDate.toLocaleDateString(props.locale === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    return h('div', { className: 'rw-page rw-calendar-page' },
      h('div', { className: 'rw-page-heading' },
        h('h1', null, props.t('Calendar', 'Lịch')),
        h('p', null, props.t('Every day is a step closer to the goal.', 'Mỗi ngày là một bước tiến gần hơn đến mục tiêu.'))
      ),
      h('section', { className: 'rw-calendar-card' },
        h('div', { className: 'rw-month-nav' },
          h('button', { onClick: function () { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12)); } }, '‹'),
          h('strong', null, month.toLocaleDateString(props.locale === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })),
          h('button', { onClick: function () { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12)); } }, '›'),
          h('button', { className: 'rw-today-btn', onClick: function () { setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1, 12)); setPicked(today); } }, props.t('Today', 'Hôm nay'))
        ),
        h('div', { className: 'rw-segment' },
          segment('all', props.t('All', 'Tất cả'), filter, setFilter),
          segment('targets', props.t('Goals', 'Mục tiêu'), filter, setFilter),
          segment('routines', props.t('Routine', 'Routine'), filter, setFilter)
        ),
        h('div', { className: 'rw-weekdays' }, dayNames.map(function (x) { return h('span', { key: x }, x); })),
        h('div', { className: 'rw-month-grid' }, cells.map(function (date) {
          var key = ymd(date);
          var m = marks(date);
          var outside = date.getMonth() !== month.getMonth();
          var selected = key === picked;
          var isToday = key === today;
          return h('button', {
            key: key,
            className: 'rw-day-cell ' + (outside ? 'outside ' : '') + (selected ? 'selected ' : '') + (isToday ? 'today ' : ''),
            onClick: function () { setPicked(key); }
          },
            h('span', null, date.getDate()),
            h('div', { className: 'rw-day-marks' },
              m.taskCount > 0 && filter !== 'routines' && h('i', { className: 'goal-dot' }),
              m.routineCount > 0 && filter !== 'targets' && h('i', { className: 'routine-dot' }),
              (m.taskCount + m.routineCount) > 2 && h('b', null, m.taskCount + m.routineCount)
            )
          );
        }))
      ),
      h('section', { className: 'rw-day-detail' },
        h('div', { className: 'rw-day-detail-head' },
          h('strong', null, monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)),
          h('span', null, selectedRows.length + ' ' + props.t('items', 'tác vụ'))
        ),
        selectedRows.length ? selectedRows.map(function (row, index) {
          if (row.type === 'task') {
            return h('div', { className: 'rw-calendar-row', key: 't' + row.task.id },
              h('button', {
                className: 'rw-check ' + (row.task.done ? 'checked' : ''),
                disabled: row.task.readonly,
                onClick: function () { if (!row.task.readonly) props.onToggleTask(row.task.id); }
              }, row.task.done ? '✓' : ''),
              h('div', null, h('strong', null, row.title), h('small', null, row.sub)),
              h('span', { className: 'rw-tag' }, props.t('Goal', 'Mục tiêu'))
            );
          }
          return h('div', { className: 'rw-calendar-row', key: 'r' + row.routine.id },
            h('span', { className: 'rw-routine-check' }, '✓'),
            h('div', null, h('strong', null, row.title), h('small', null, row.sub)),
            h('span', { className: 'rw-tag routine' }, 'Routine')
          );
        }) : h('div', { className: 'rw-empty-day' }, props.t('Nothing scheduled for this day.', 'Ngày này chưa có gì được lên lịch.')),
        picked >= props.week.startDate && picked <= props.week.endDate && h('button', { className: 'rw-add-day', onClick: function () { props.onAddTask('', picked); } }, '+ ', props.t('Add task on this day', 'Thêm tác vụ vào ngày này'))
      )
    );
  }

  function segment(value, label, active, setter) {
    return h('button', { className: active === value ? 'active' : '', onClick: function () { setter(value); } }, label);
  }

  function ProgressView(props) {
    var tasks = allTasks(props.week);
    var done = tasks.filter(function (x) { return x.done; }).length;
    var completion = pct(done, tasks.length);
    var targets = props.week.targets || [];
    var archived = (props.data.weeks || []).filter(function (w) { return w.status === 'complete'; });
    var trend = archived.slice(-4).map(function (w) {
      var wt = allTasks(w);
      return pct(wt.filter(function (x) { return x.done; }).length, wt.length);
    });
    while (trend.length < 4) trend.unshift(0);
    var best = Math.max.apply(Math, trend.concat([completion]));

    return h('div', { className: 'rw-page' },
      h('div', { className: 'rw-page-heading' },
        h('h1', null, props.t('Progress', 'Thống kê')),
        h('p', null, props.t('See whether execution is actually improving.', 'Nhìn xem năng lực thực thi có thực sự tốt lên không.'))
      ),
      h('section', { className: 'rw-progress-kpis' },
        h('article', null, h('strong', null, completion + '%'), h('small', null, props.t('Completion', 'Tỷ lệ hoàn thành'))),
        h('article', null, h('strong', null, done + '/' + tasks.length), h('small', null, props.t('Tasks done', 'Tác vụ đã xong'))),
        h('article', null, h('strong', null, targets.filter(function (x) { return goalStats(x).percent === 100; }).length), h('small', null, props.t('Goals completed', 'Mục tiêu hoàn tất')))
      ),
      h('section', { className: 'rw-card rw-progress-chart' },
        h('h3', null, props.t('Execution by week', 'Tiến độ theo tuần')),
        h('div', { className: 'rw-week-chart' }, trend.concat([completion]).slice(-4).map(function (value, i) {
          return h('div', { key: i },
            h('b', null, value + '%'),
            h('span', null, h('i', { style: { height: (best ? Math.max(8, value / best * 100) : 8) + '%' } })),
            h('small', null, props.t('Week ', 'Tuần ') + (i + 1))
          );
        }))
      ),
      h(SectionTitle, { title: props.t('Progress by goal', 'Tiến độ theo mục tiêu') }),
      h('section', { className: 'rw-card rw-progress-goals' }, targets.length ? targets.map(function (target, index) {
        var s = goalStats(target);
        return h('div', { key: target.id },
          h('span', { className: 'rw-goal-icon mini' }, goalGlyph(index)),
          h('strong', null, target.title),
          h('div', { className: 'rw-progress small' }, h('i', { style: { width: s.percent + '%' } })),
          h('b', null, s.percent + '%')
        );
      }) : h('p', { className: 'rw-muted' }, props.t('No goals yet.', 'Chưa có mục tiêu.')))
    );
  }

  function EmptyState(props) {
    return h('section', { className: 'rw-empty-state' },
      h('img', { src: 'brand/rootwork-mark.png', alt: '' }),
      h('h3', null, props.title),
      h('p', null, props.text),
      h('button', { className: 'rw-primary', onClick: props.action }, props.actionText)
    );
  }

  function BottomNav(props) {
    function nav(value, glyph, en, vi) {
      return h('button', { className: props.view === value ? 'active' : '', onClick: function () { props.setView(value); } },
        h('b', null, glyph), h('span', null, props.t(en, vi)));
    }
    return h('nav', { className: 'rw-bottom-nav' },
      nav('dashboard', '⌂', 'Dashboard', 'Dashboard'),
      nav('goals', '◎', 'Goals', 'Mục tiêu'),
      nav('calendar', '□', 'Calendar', 'Lịch'),
      nav('progress', '▥', 'Progress', 'Thống kê'),
      h('button', { onClick: props.onAdd }, h('b', null, '+'), h('span', null, props.t('Add', 'Thêm')))
    );
  }

  function ModalHost(props) {
    var modal = props.modal;
    if (modal.type === 'target') return h(TargetModal, props);
    if (modal.type === 'task') return h(TaskModal, props);
    if (modal.type === 'routine') return h(RoutineModal, props);
    if (modal.type === 'settings') return h(SettingsModal, props);
    if (modal.type === 'quick') return h(QuickModal, props);
    return null;
  }

  function ModalFrame(props) {
    return h('div', { className: 'rw-modal-backdrop', onMouseDown: function (e) { if (e.target === e.currentTarget) props.close(); } },
      h('section', { className: 'rw-modal' },
        h('header', null, h('h2', null, props.title), h('button', { onClick: props.close }, '×')),
        props.children
      )
    );
  }

  function TargetModal(props) {
    var titleState = useState(''), title = titleState[0], setTitle = titleState[1];
    var descState = useState(''), desc = descState[0], setDesc = descState[1];
    function submit(e) {
      e.preventDefault();
      if (!title.trim()) return;
      props.addTarget(title.trim(), desc.trim());
      props.close();
    }
    return h(ModalFrame, { title: props.t('New goal', 'Tạo mục tiêu mới'), close: props.close },
      h('form', { onSubmit: submit, className: 'rw-form' },
        field(props.t('Goal title', 'Tiêu đề mục tiêu'), h('input', { value: title, onChange: function (e) { setTitle(e.target.value); }, autoFocus: true, placeholder: props.t('Launch landing page', 'Ra mắt landing page') })),
        field(props.t('Description', 'Mô tả'), h('textarea', { value: desc, onChange: function (e) { setDesc(e.target.value); }, rows: 3, placeholder: props.t('What does success look like?', 'Kết quả thành công trông như thế nào?') })),
        h('button', { className: 'rw-primary', type: 'submit' }, props.t('Create goal', 'Tạo mục tiêu'))
      )
    );
  }

  function TaskModal(props) {
    var titleState = useState(''), title = titleState[0], setTitle = titleState[1];
    var targetState = useState(props.modal.targetId || ''), targetId = targetState[0], setTargetId = targetState[1];
    var dateState = useState(props.modal.date || ''), date = dateState[0], setDate = dateState[1];
    var priorityState = useState('normal'), priority = priorityState[0], setPriority = priorityState[1];
    function submit(e) {
      e.preventDefault();
      if (!title.trim()) return;
      props.addTask({ title: title.trim(), targetId: targetId, date: date, priority: priority });
      props.close();
    }
    return h(ModalFrame, { title: props.t('Weekly task', 'Tạo tác vụ tuần'), close: props.close },
      h('form', { onSubmit: submit, className: 'rw-form' },
        field(props.t('Task', 'Tác vụ'), h('input', { value: title, onChange: function (e) { setTitle(e.target.value); }, autoFocus: true, placeholder: props.t('Write landing page copy', 'Viết nội dung chính') })),
        field(props.t('Goal', 'Mục tiêu'), h('select', { value: targetId, onChange: function (e) { setTargetId(e.target.value); } },
          h('option', { value: '' }, props.t('No goal / loose task', 'Không gắn mục tiêu')),
          (props.week.targets || []).map(function (target) { return h('option', { key: target.id, value: target.id }, target.title); })
        )),
        field(props.t('Day (optional)', 'Ngày (không bắt buộc)'), h('input', { type: 'date', min: props.week.startDate, max: props.week.endDate, value: date, onChange: function (e) { setDate(e.target.value); } })),
        h('div', { className: 'rw-segment rw-priority-segment' },
          segment('normal', props.t('Normal', 'Bình thường'), priority, setPriority),
          segment('high', props.t('High priority', 'Ưu tiên cao'), priority, setPriority)
        ),
        h('button', { className: 'rw-primary', type: 'submit' }, props.t('Add weekly task', 'Thêm tác vụ tuần'))
      )
    );
  }

  function RoutineModal(props) {
    var nameState = useState(''), name = nameState[0], setName = nameState[1];
    var targetState = useState(3), target = targetState[0], setTarget = targetState[1];
    function submit(e) {
      e.preventDefault();
      if (!name.trim()) return;
      props.addRoutine(name.trim(), target);
      props.close();
    }
    return h(ModalFrame, { title: props.t('New routine', 'Thêm thói quen'), close: props.close },
      h('form', { onSubmit: submit, className: 'rw-form' },
        field(props.t('Routine', 'Thói quen'), h('input', { value: name, onChange: function (e) { setName(e.target.value); }, autoFocus: true, placeholder: props.t('Exercise', 'Tập thể dục') })),
        field(props.t('Times per week', 'Số lần mỗi tuần'), h('input', { type: 'number', min: 1, max: 7, value: target, onChange: function (e) { setTarget(e.target.value); } })),
        h('button', { className: 'rw-primary', type: 'submit' }, props.t('Add routine', 'Thêm thói quen'))
      )
    );
  }

  function QuickModal(props) {
    return h(ModalFrame, { title: props.t('Add', 'Thêm'), close: props.close },
      h('div', { className: 'rw-quick-grid' },
        h('button', { onClick: function () { props.replaceModal({ type: 'target' }); } }, h('b', null, '◎'), h('span', null, props.t('Goal', 'Mục tiêu'))),
        h('button', { onClick: function () { props.replaceModal({ type: 'task', targetId: '', date: '' }); } }, h('b', null, '≡'), h('span', null, props.t('Weekly task', 'Tác vụ tuần'))),
        h('button', { onClick: function () { props.replaceModal({ type: 'routine' }); } }, h('b', null, '↻'), h('span', null, props.t('Routine', 'Thói quen')))
      )
    );
  }

  function SettingsModal(props) {
    var fileRef = useRef(null);
    return h(ModalFrame, { title: props.t('Settings & data', 'Cài đặt & dữ liệu'), close: props.close },
      h('div', { className: 'rw-settings' },
        h('div', { className: 'rw-settings-row' },
          h('div', null, h('strong', null, props.t('Language', 'Ngôn ngữ')), h('small', null, props.t('Interface language', 'Ngôn ngữ giao diện'))),
          h('div', { className: 'rw-segment compact' },
            segment('en', 'ENG', props.locale, props.changeLocale),
            segment('vi', 'VIE', props.locale, props.changeLocale)
          )
        ),
        h('button', { className: 'rw-secondary', onClick: function () { S.exportBackup(props.data); } }, props.t('Export backup', 'Xuất bản sao lưu')),
        h('input', { ref: fileRef, className: 'rw-hidden', type: 'file', accept: '.json,application/json', onChange: function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          S.importBackup(file, function (error, imported) {
            if (error) return alert(error);
            try { S.save(D.ensureCurrentWeek(imported)); global.location.reload(); } catch (err) { alert(err.message); }
          });
        }}),
        h('button', { className: 'rw-secondary', onClick: function () { fileRef.current && fileRef.current.click(); } }, props.t('Restore backup', 'Khôi phục bản sao lưu')),
        h('p', { className: 'rw-settings-note' }, props.t('Rootwork stays local-first: your data remains in this browser unless you export it.', 'Rootwork vẫn local-first: dữ liệu nằm trong trình duyệt này trừ khi mày tự xuất backup.'))
      )
    );
  }

  function field(label, control) {
    return h('label', { className: 'rw-field' }, h('span', null, label), control);
  }

  var mount = document.getElementById('root');
  var root = ReactDOM.createRoot ? ReactDOM.createRoot(mount) : null;
  if (root) root.render(h(App));
  else ReactDOM.render(h(App), mount);

  if ('serviceWorker' in navigator) {
    global.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
  }
}(window));
