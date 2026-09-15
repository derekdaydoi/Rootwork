/* Rootwork Roadmap UI — large weekly work surfaces + target timeline. */
(function (g) {
  'use strict';

  var U = g.RootworkUI;
  if (!U) return;
  var R = U.R, D = U.D, h = U.h, I = U.I;
  var Ring = U.Ring, Bar = U.Bar;

  var PATHS = {
    roadmap: ['M7 4v16','M7 8h5a4 4 0 0 1 4 4v0','M7 16h5a4 4 0 0 0 4-4','M16 9v6'],
    rocket: ['M14.5 4.5c2.3-1.1 4.6-1.2 5.5-1.2-.1.9-.2 3.2-1.3 5.5l-4.5 4.5-4.4-4.4z','M9.8 8.9 6 9.7 3.8 12l4.2 1','M14.2 13.3l-1 4.2 2.2 2.2 2.3-2.3.8-3.8','M8.4 15.6 5 19'],
    users: ['M16 20v-1.6a4.4 4.4 0 0 0-4.4-4.4H7.4A4.4 4.4 0 0 0 3 18.4V20','M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z','M17 11a3 3 0 0 0 0-6','M21 20v-1.5a4 4 0 0 0-3-3.9'],
    flag: ['M5 21V4','M5 5h11l-2 3 2 3H5'],
    trend: ['M4 17l5-5 4 4 7-8','M15 8h5v5'],
    more: ['M5 12h.01','M12 12h.01','M19 12h.01']
  };

  function RI(name, size, width) {
    var paths = PATHS[name] || [];
    return h('svg', {
      width: size || 24, height: size || 24, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: width || 2,
      strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true'
    }, paths.map(function (d, index) { return h('path', { d: d, key: index }); }));
  }

  function fmtDate(value) {
    if (!D.isIsoDate(value)) return 'Chưa đặt ngày';
    return D.parseYmd(value).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtWeekRange(week) {
    var start = D.parseYmd(week.startDate);
    var end = D.parseYmd(week.endDate);
    return start.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }) + ' – ' +
      end.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  }

  function targetVisual(target) {
    var title = String(target.title || '').toLowerCase();
    if (/ra mắt|launch|sản phẩm|product/.test(title)) return { icon: 'rocket', tone: 'blue' };
    if (/doanh thu|revenue|sales|tăng trưởng|growth/.test(title)) return { icon: 'trend', tone: 'violet' };
    if (/team|đội ngũ|tuyển|people/.test(title)) return { icon: 'users', tone: 'teal' };
    if (/tự động|automation|vận hành|process/.test(title)) return { icon: 'settings', tone: 'blue', core: true };
    if (/thị trường|market|mở rộng|expand/.test(title)) return { icon: 'flag', tone: 'violet' };
    return { icon: 'goal', tone: 'blue', core: true };
  }

  function visualIcon(meta, size) {
    return meta.core ? I(meta.icon, size || 21, 2) : RI(meta.icon, size || 21, 2);
  }

  function FocusGoal(q) {
    if (!q.target) return h('button', { className: 'card focus-goal-card focus-goal-empty', onClick: q.addGoal },
      h('span', { className: 'focus-goal-icon' }, I('goal', 22, 2)),
      h('div', null, h('small', null, 'Mục tiêu hiện tại'), h('strong', null, 'Tạo mục tiêu cho tuần này')),
      I('right', 19, 2)
    );
    var stats = D.targetMetrics(q.target);
    return h('section', { className: 'card focus-goal-card' },
      h('div', { className: 'focus-goal-top' },
        h('span', { className: 'focus-goal-icon' }, I('goal', 22, 2)),
        h('div', null, h('small', null, 'Mục tiêu hiện tại'), h('strong', null, q.target.title)),
        h('button', { onClick: function () { q.go('goals'); } }, 'Xem tất cả ›')
      ),
      Bar(stats.percent, false),
      h('div', { className: 'focus-goal-foot' },
        h('span', null, stats.done + '/' + stats.total + ' tác vụ'),
        h('b', null, stats.percent + '%')
      )
    );
  }

  function WeekTaskRow(q) {
    var task = q.task;
    var dateText = task.date === D.today() ? 'Hôm nay' : (task.date ? fmtDate(task.date) : 'Linh hoạt');
    var meta = task.targetTitle || 'Tác vụ tuần';
    return h('article', { className: 'card week-task-row ' + (task.done ? 'done' : '') },
      h('button', {
        type: 'button',
        className: 'week-check ' + (task.done ? 'checked' : ''),
        onClick: function () { q.toggle(task); },
        'aria-label': task.done ? 'Đánh dấu chưa xong' : 'Hoàn thành'
      }, task.done && I('check', 21, 3)),
      h('button', { type: 'button', className: 'week-task-copy', onClick: function () { q.edit(task); } },
        h('strong', null, task.title),
        h('small', null, dateText + ' · ' + meta)
      ),
      h('button', {
        type: 'button', className: 'week-task-more',
        onClick: function () { q.edit(task); }, 'aria-label': 'Sửa tác vụ'
      }, RI('more', 22, 3))
    );
  }

  U.Dashboard = function Dashboard(q) {
    var allTasks = D.sortTasks(D.weekTasks(q.w));
    var done = allTasks.filter(function (task) { return task.done; }).length;
    var completion = allTasks.length ? Math.round(done / allTasks.length * 100) : 0;
    var goals = (q.w.targets || []).filter(function (target) { return target.status !== 'removed'; });
    var lead = goals.find(function (target) {
      var stats = D.targetMetrics(target);
      return !(stats.total > 0 && stats.percent === 100);
    }) || goals[0] || null;

    return h('div', { className: 'page dashboard-page roadmap-dashboard' },
      h('section', { className: 'greeting roadmap-greeting' },
        h('h1', null, U.greeting()),
        h('p', null, 'Hôm nay là một ngày tốt để tiến lên.')
      ),
      h('section', { className: 'dashboard-progress card roadmap-progress' },
        Ring(completion, 78),
        h('div', null,
          h('span', null, 'Tiến độ tuần'),
          h('strong', null, done + ' / ' + allTasks.length + ' tác vụ'),
          h('small', null, completion >= 70 ? 'Đang giữ nhịp rất tốt.' : 'Hoàn thành từng việc, đừng vội.')
        )
      ),
      h(FocusGoal, { target: lead, go: q.go, addGoal: q.addGoal }),
      h('div', { className: 'weekly-work-head' },
        h('div', null, h('h2', null, 'Công việc tuần này'), h('span', null, fmtWeekRange(q.w))),
        h('b', null, Math.max(0, allTasks.length - done) + ' còn lại')
      ),
      h('section', { className: 'weekly-work-list' },
        allTasks.length ? allTasks.map(function (task) {
          return h(WeekTaskRow, { key: task.weekId + ':' + task.id, task: task, toggle: q.toggleTask, edit: q.editTask });
        }) : h('div', { className: 'card weekly-work-empty' },
          h('strong', null, 'Tuần này chưa có tác vụ'),
          h('small', null, 'Thêm một việc đủ nhỏ để bắt đầu.')
        ),
        h('button', { className: 'week-task-fab', onClick: function () { q.addTask('', ''); }, 'aria-label': 'Thêm tác vụ tuần' }, I('plus', 26, 2.4))
      )
    );
  };

  function roadmapItems(data) {
    return D.roadmapTargets ? D.roadmapTargets(data) : [];
  }

  function RoadmapCard(q) {
    var visual = targetVisual(q.item);
    return h('article', { className: 'roadmap-target-card card' },
      h('span', { className: 'roadmap-target-icon ' + visual.tone }, visualIcon(visual, 21)),
      h('div', null,
        h('strong', null, q.item.title),
        h('small', null, q.item.description || ('Mốc ' + fmtDate(q.item.roadmapDate)))
      ),
      h('time', null, fmtDate(q.item.roadmapDate))
    );
  }

  U.Roadmap = function Roadmap(q) {
    var modeState = R.useState('tree'), mode = modeState[0], setMode = modeState[1];
    var horizonState = R.useState(5), horizon = horizonState[0], setHorizon = horizonState[1];
    var today = D.today();
    var currentYear = D.parseYmd(today).getFullYear();
    var lastYear = currentYear + Number(horizon) - 1;
    var items = roadmapItems(q.data);
    var visible = items.filter(function (item) {
      var year = D.parseYmd(item.roadmapDate).getFullYear();
      return year <= lastYear;
    });
    var years = [];
    for (var year = currentYear; year <= lastYear; year += 1) years.push(year);

    return h('div', { className: 'page roadmap-page' },
      h('header', { className: 'roadmap-head' },
        h('div', null, h('h1', null, 'Roadmap'), h('p', null, 'Nhìn xa hơn. Xây dựng tương lai của bạn.')),
        h('label', { className: 'roadmap-horizon' },
          h('span', null, 'Tầm nhìn'),
          h('select', { value: horizon, onChange: function (e) { setHorizon(Number(e.target.value)); } },
            [3, 5, 10].map(function (n) { return h('option', { key: n, value: n }, n + ' năm'); })
          )
        )
      ),
      h('div', { className: 'roadmap-switch' },
        h('button', { className: mode === 'tree' ? 'active' : '', onClick: function () { setMode('tree'); } }, 'Cây roadmap'),
        h('button', { className: mode === 'list' ? 'active' : '', onClick: function () { setMode('list'); } }, 'Danh sách')
      ),
      mode === 'tree' ? h('section', { className: 'roadmap-canvas card' },
        h('div', { className: 'roadmap-now' },
          h('span', { className: 'roadmap-now-star' }, I('star', 18, 2)),
          h('div', null, h('strong', null, 'Hiện tại'), h('small', null, 'Bắt đầu từ hôm nay')),
          h('p', null, 'Tiếp tục giữ nhịp và xây nền tảng vững chắc.')
        ),
        years.map(function (year) {
          var yearItems = visible.filter(function (item) {
            var itemYear = D.parseYmd(item.roadmapDate).getFullYear();
            return year === currentYear ? itemYear <= currentYear : itemYear === year;
          });
          return h('div', { className: 'roadmap-year', key: year },
            h('div', { className: 'roadmap-year-label' }, h('i'), h('strong', null, String(year))),
            h('div', { className: 'roadmap-year-cards' },
              yearItems.length ? yearItems.map(function (item) {
                return h(RoadmapCard, { key: item.roadmapId, item: item });
              }) : h('div', { className: 'roadmap-year-empty' }, 'Chưa có mốc')
            )
          );
        }),
        h('div', { className: 'roadmap-landscape', 'aria-hidden': 'true' },
          h('span', { className: 'mountain m1' }),
          h('span', { className: 'mountain m2' }),
          h('span', { className: 'mountain m3' }),
          h('span', { className: 'road' }),
          h('span', { className: 'tree t1' }),
          h('span', { className: 'tree t2' }),
          h('span', { className: 'tree t3' })
        )
      ) : h('section', { className: 'roadmap-list' },
        visible.length ? visible.map(function (item) {
          return h(RoadmapCard, { key: item.roadmapId, item: item });
        }) : h('div', { className: 'card roadmap-empty' },
          h('strong', null, 'Roadmap đang trống'),
          h('small', null, 'Bật “Đưa vào Roadmap” khi tạo hoặc sửa mục tiêu để mốc xuất hiện ở đây.')
        )
      )
    );
  };

  U.Nav = function Nav(q) {
    function button(view, icon, label, custom) {
      return h('button', {
        className: q.v === view ? 'active' : '',
        onClick: function () { q.go(view); }
      }, custom ? RI(icon, 24, 2) : I(icon, 24, 2), h('span', null, label));
    }
    return h('nav', { className: 'nav nav-v2 roadmap-nav' },
      button('dashboard', 'home', 'Trang chủ'),
      button('goals', 'goal', 'Mục tiêu'),
      button('roadmap', 'roadmap', 'Roadmap', true),
      button('calendar', 'cal', 'Lịch'),
      button('routines', 'routine', 'Routine'),
      button('progress', 'chart', 'Thống kê')
    );
  };
}(window));
