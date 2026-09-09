/* Rootwork Artifact UI — mockup-inspired dashboard, artifact surfaces, and interval calendar. */
(function (g) {
  'use strict';

  var U = g.RootworkUI;
  if (!U) return;
  var R = U.R, D = U.D, h = U.h, I = U.I;
  var Task = U.Task, Ring = U.Ring, Bar = U.Bar;

  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(date) { return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()); }
  function pd(value) {
    var p = String(value || '').split('-').map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1, 12);
  }
  function fmtShort(value) {
    if (!D.isIsoDate(value)) return '—';
    var d = pd(value);
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  }
  function fmtRange(artifact) { return fmtShort(artifact.startDate) + ' – ' + fmtShort(artifact.endDate); }
  function phaseLabel(phase) {
    return {
      active: 'Đang thực hiện', upcoming: 'Sắp tới', overdue: 'Quá hạn',
      paused: 'Tạm dừng', completed: 'Hoàn thành', cancelled: 'Đã huỷ'
    }[phase] || 'Artifact';
  }
  function phaseTone(phase) {
    if (phase === 'completed') return 'success';
    if (phase === 'upcoming') return 'upcoming';
    if (phase === 'overdue') return 'danger';
    if (phase === 'paused') return 'paused';
    return 'active';
  }
  function artifactIcon() {
    return h('span', { className: 'artifact-icon' }, I('briefcase', 18, 1.9));
  }
  function artifactProgress(data, artifact) { return D.artifactTaskProgress(data, artifact.id); }
  function artifactSort(a, b) {
    var pa = D.artifactPhase(a), pb = D.artifactPhase(b);
    var order = { active: 0, overdue: 1, paused: 2, upcoming: 3, completed: 4, cancelled: 5 };
    if (order[pa] !== order[pb]) return order[pa] - order[pb];
    return a.startDate.localeCompare(b.startDate);
  }

  function ArtifactCard(q) {
    var artifact = q.artifact;
    var phase = D.artifactPhase(artifact);
    var progress = artifactProgress(q.data, artifact);
    return h('button', { className: 'artifact-card card', onClick: function () { q.open(artifact.id); } },
      h('div', { className: 'artifact-card-top' },
        artifactIcon(),
        h('div', { className: 'artifact-card-title' }, h('strong', null, artifact.title), h('small', null, fmtRange(artifact))),
        h('span', { className: 'artifact-status ' + phaseTone(phase) }, phaseLabel(phase))
      ),
      h('div', { className: 'artifact-card-progress' },
        h('span', null, progress.done + '/' + progress.total + ' tác vụ hoàn thành'),
        h('b', null, progress.percent + '%')
      ),
      h('div', { className: 'artifact-progress-track' }, h('i', { style: { width: progress.percent + '%' } }))
    );
  }

  U.Dashboard = function Dashboard(q) {
    var allTasks = D.weekTasks(q.w);
    var done = allTasks.filter(function (x) { return x.done; }).length;
    var completion = allTasks.length ? Math.round(done / allTasks.length * 100) : 0;
    var today = D.today();
    var todayTasks = D.sortTasks(allTasks.filter(function (x) { return !x.done && x.date === today; }));
    if (!todayTasks.length) todayTasks = D.sortTasks(allTasks.filter(function (x) { return !x.done; })).slice(0, 3);
    var artifacts = (q.data.artifacts || []).filter(function (a) {
      var phase = D.artifactPhase(a);
      return phase !== 'cancelled' && phase !== 'completed' && D.artifactOverlapsRange(a, q.w.startDate, q.w.endDate);
    }).sort(artifactSort);
    var lead = artifacts[0] || null;

    return h('div', { className: 'page dashboard-page artifact-dashboard' },
      h('section', { className: 'greeting artifact-greeting' },
        h('h1', null, U.greeting()),
        h('p', null, 'Hôm nay là một bước tiến tốt hơn.')
      ),
      h('section', { className: 'dashboard-progress card' },
        Ring(completion, 68),
        h('div', null, h('span', null, 'Tiến độ tuần'), h('strong', null, done + ' / ' + allTasks.length + ' tác vụ'),
          h('small', null, completion >= 70 ? 'Nhịp thực thi đang tốt.' : 'Giữ nhịp đều, hoàn thành từng việc.'))
      ),
      h('div', { className: 'artifact-section-head' }, h('h2', null, 'Artifact đang xây'),
        h('button', { onClick: function () { q.go('artifacts'); } }, 'Xem tất cả ›')),
      lead ? h(ArtifactCard, { artifact: lead, data: q.data, open: q.openArtifact }) :
        h('button', { className: 'artifact-empty card', onClick: q.addArtifact }, artifactIcon(), h('div', null, h('strong', null, 'Bắt đầu xây một Artifact'), h('small', null, 'Một thứ cụ thể, một khoảng thời gian, nhiều tác vụ.')), I('plus', 18)),
      h('div', { className: 'artifact-section-head task-section-head' }, h('h2', null, todayTasks.length && todayTasks[0].date === today ? 'Tác vụ hôm nay' : 'Tác vụ cần làm'), h('span', null, allTasks.length - done + ' còn lại')),
      h('section', { className: 'card dashboard-task-list' },
        todayTasks.length ? todayTasks.map(function (task) {
          return h(Task, { key: task.id, x: task, toggle: q.toggleTask, edit: q.editTask });
        }) : h('div', { className: 'dashboard-clear' }, h('strong', null, 'Không còn tác vụ mở'), h('small', null, 'Khoảng trống cũng là một phần của nhịp tốt.'))
      )
    );
  };

  U.Artifacts = function Artifacts(q) {
    var state = R.useState('all'), filter = state[0], setFilter = state[1];
    var all = (q.data.artifacts || []).slice().sort(artifactSort);
    var list = all.filter(function (artifact) {
      var phase = D.artifactPhase(artifact);
      if (filter === 'all') return phase !== 'cancelled';
      if (filter === 'active') return ['active', 'overdue', 'paused'].indexOf(phase) >= 0;
      return phase === filter;
    });
    return h('div', { className: 'page artifacts-page' },
      h('div', { className: 'artifact-page-head' },
        h('div', null, h('h1', null, 'Artifact'), h('p', null, 'Những điều lớn được tạo nên từ nhiều tác vụ nhỏ.')),
        h('button', { className: 'circle', onClick: q.addArtifact, 'aria-label': 'Thêm Artifact' }, I('plus', 23))
      ),
      h('div', { className: 'artifact-filters' },
        [['all', 'Tất cả'], ['active', 'Đang thực hiện'], ['upcoming', 'Sắp tới'], ['completed', 'Hoàn thành']].map(function (x) {
          return h('button', { key: x[0], className: filter === x[0] ? 'active' : '', onClick: function () { setFilter(x[0]); } }, x[1]);
        })
      ),
      list.length ? h('div', { className: 'artifact-list' }, list.map(function (artifact) {
        return h(ArtifactCard, { key: artifact.id, artifact: artifact, data: q.data, open: q.openArtifact });
      })) : h('section', { className: 'empty card artifact-list-empty' }, h('h3', null, 'Chưa có Artifact'), h('p', null, 'Tạo một thứ cụ thể mà mày muốn xây qua nhiều ngày hoặc nhiều tuần.'), h('button', { className: 'primary', onClick: q.addArtifact }, 'Tạo Artifact'))
    );
  };

  U.ArtifactDetail = function ArtifactDetail(q) {
    var artifact = q.artifact;
    if (!artifact) return h('div', { className: 'page' }, h('button', { className: 'back-link', onClick: q.backFromArtifact }, '‹ Artifact'), h('section', { className: 'empty card' }, h('h3', null, 'Artifact không còn tồn tại')));
    var phase = D.artifactPhase(artifact);
    var progress = artifactProgress(q.data, artifact);
    var timeProgress = D.artifactTimeProgress(artifact);
    var linked = D.artifactTasks(q.data, artifact.id).sort(function (a, b) {
      if (!a.date && !b.date) return a.title.localeCompare(b.title);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });

    return h('div', { className: 'page artifact-detail-page' },
      h('header', { className: 'artifact-detail-nav' },
        h('button', { onClick: q.backFromArtifact, 'aria-label': 'Quay lại' }, I('left', 21)),
        h('button', { onClick: function () { q.editArtifact(artifact); }, 'aria-label': 'Sửa Artifact' }, I('edit', 18))
      ),
      h('section', { className: 'artifact-detail-hero' },
        h('div', { className: 'artifact-detail-title' }, artifactIcon(), h('div', null, h('h1', null, artifact.title), h('span', { className: 'artifact-status ' + phaseTone(phase) }, phaseLabel(phase)))),
        artifact.description && h('p', null, artifact.description),
        h('div', { className: 'artifact-detail-range' }, I('cal', 16), h('strong', null, fmtRange(artifact)))
      ),
      h('section', { className: 'card artifact-timeline-card' },
        h('div', { className: 'artifact-card-heading' }, h('h2', null, 'Timeline'), h('span', null, phase === 'active' ? Math.max(0, D.diffDays(artifact.endDate, D.today())) + ' ngày còn lại' : phaseLabel(phase))),
        h('div', { className: 'timeline-labels' }, h('span', null, fmtShort(artifact.startDate)), h('span', null, fmtShort(artifact.endDate))),
        h('div', { className: 'artifact-timeline' }, h('i', { style: { width: timeProgress + '%' } }), h('b', { style: { left: 'calc(' + timeProgress + '% - 5px)' } })),
        h('small', { className: 'timeline-note' }, 'Thanh này biểu diễn thời gian đã trôi qua, không phải mức độ hoàn thiện.')
      ),
      h('section', { className: 'artifact-stats' },
        h('article', { className: 'card' }, h('strong', null, progress.total), h('small', null, 'Tác vụ liên kết')),
        h('article', { className: 'card success' }, h('strong', null, progress.done), h('small', null, 'Đã hoàn thành')),
        h('article', { className: 'card' }, h('strong', null, Math.max(0, progress.total - progress.done)), h('small', null, 'Còn lại'))
      ),
      h('div', { className: 'artifact-section-head detail-task-head' }, h('h2', null, 'Tác vụ liên kết'), h('button', { onClick: function () { q.addTask('', '', artifact.id); } }, 'Thêm tác vụ +')),
      h('section', { className: 'card linked-task-list' },
        linked.length ? linked.map(function (task) {
          return h(Task, { key: task.weekId + task.id, x: task, toggle: task.readonly ? function () {} : q.toggleTask, edit: task.readonly ? null : q.editTask });
        }) : h('div', { className: 'dashboard-clear' }, h('strong', null, 'Chưa có tác vụ liên kết'), h('small', null, 'Artifact trở nên có ý nghĩa khi các tác vụ thực thi bắt đầu đẩy nó tiến lên.'))
      ),
      h('div', { className: 'artifact-actions' },
        phase === 'completed' ? h('button', { className: 'secondary', onClick: function () { q.reopenArtifact(artifact.id); } }, 'Mở lại Artifact') :
          h('button', { className: 'primary', onClick: function () { q.completeArtifact(artifact.id); } }, 'Đánh dấu hoàn thành'),
        phase !== 'completed' && h('button', { className: 'secondary', onClick: function () { if (phase === 'paused') q.reopenArtifact(artifact.id); else q.pauseArtifact(artifact.id); } }, phase === 'paused' ? 'Tiếp tục' : 'Tạm dừng')
      )
    );
  };

  U.Calendar = function Calendar(q) {
    var today = D.today();
    var initial = pd(today);
    var ms = R.useState(new Date(initial.getFullYear(), initial.getMonth(), 1, 12)), month = ms[0], setMonth = ms[1];
    var ps = R.useState(today), picked = ps[0], setPicked = ps[1];
    var start = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    var gridStart = new Date(start);
    gridStart.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    var weeks = [];
    for (var r = 0; r < 6; r += 1) {
      var row = [];
      for (var c = 0; c < 7; c += 1) {
        var d = new Date(gridStart);
        d.setDate(gridStart.getDate() + r * 7 + c);
        row.push(d);
      }
      weeks.push(row);
    }

    var taskIndex = {};
    (q.data.weeks || []).forEach(function (week) {
      D.weekTasks(week).forEach(function (task) {
        if (!task.date) return;
        var copy = Object.assign({}, task, { readonly: week.status === 'complete' });
        (taskIndex[task.date] || (taskIndex[task.date] = [])).push(copy);
      });
    });
    var artifacts = (q.data.artifacts || []).filter(function (artifact) { return artifact.state !== 'cancelled'; });
    var pickedTasks = taskIndex[picked] || [];
    var pickedArtifacts = artifacts.filter(function (artifact) { return D.artifactContainsDate(artifact, picked); });

    function changeMonth(delta) { setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1, 12)); }

    return h('div', { className: 'page calendar-v2' },
      h('div', { className: 'calendar-title-row' }, h('h1', null, 'Lịch'), h('button', { className: 'today-chip', onClick: function () { setMonth(new Date(initial.getFullYear(), initial.getMonth(), 1, 12)); setPicked(today); } }, 'Hôm nay')),
      h('section', { className: 'calendar-v2-panel card' },
        h('div', { className: 'month-nav calendar-v2-nav' }, h('button', { onClick: function () { changeMonth(-1); } }, I('left', 18)), h('strong', null, month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })), h('button', { onClick: function () { changeMonth(1); } }, I('right', 18))),
        h('div', { className: 'weekdays calendar-v2-weekdays' }, ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(function (n) { return h('span', { key: n }, n); })),
        h('div', { className: 'calendar-v2-weeks' }, weeks.map(function (row, rowIndex) {
          var rowStart = ymd(row[0]), rowEnd = ymd(row[6]);
          var rowArtifacts = artifacts.filter(function (artifact) { return D.artifactOverlapsRange(artifact, rowStart, rowEnd); }).slice(0, 2);
          return h('div', { className: 'calendar-week-row', key: rowStart },
            h('div', { className: 'calendar-week-days' }, row.map(function (date) {
              var key = ymd(date), dayTasks = taskIndex[key] || [];
              return h('button', { key: key, className: 'calendar-v2-day ' + (date.getMonth() !== month.getMonth() ? 'outside ' : '') + (key === picked ? 'selected ' : '') + (key === today ? 'today ' : ''), onClick: function () { setPicked(key); } },
                h('span', null, date.getDate()),
                dayTasks.length ? h('i', { className: dayTasks.every(function (t) { return t.done; }) ? 'done' : 'some' }) : null
              );
            })),
            rowArtifacts.map(function (artifact, lane) {
              var from = artifact.startDate > rowStart ? artifact.startDate : rowStart;
              var to = artifact.endDate < rowEnd ? artifact.endDate : rowEnd;
              var startCol = D.diffDays(from, rowStart);
              var span = D.diffDays(to, from) + 1;
              var phase = D.artifactPhase(artifact);
              return h('button', {
                key: artifact.id,
                className: 'calendar-artifact-range ' + phaseTone(phase),
                style: { left: 'calc(' + (startCol * 100 / 7) + '% + 2px)', width: 'calc(' + (span * 100 / 7) + '% - 4px)', bottom: (4 + lane * 11) + 'px' },
                onClick: function (e) { e.stopPropagation(); q.openArtifact(artifact.id); },
                title: artifact.title
              }, span >= 2 ? artifact.title : '•');
            })
          );
        }))
      ),
      h('section', { className: 'calendar-picked-head' },
        h('div', null, h('strong', null, pd(picked).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })), h('small', null, pickedTasks.length + ' tác vụ · ' + pickedArtifacts.length + ' Artifact'))
      ),
      pickedArtifacts.length ? h('div', { className: 'picked-artifacts' }, pickedArtifacts.map(function (artifact) {
        return h('button', { key: artifact.id, onClick: function () { q.openArtifact(artifact.id); } }, artifactIcon(), h('div', null, h('strong', null, artifact.title), h('small', null, fmtRange(artifact))), h('span', { className: 'artifact-status ' + phaseTone(D.artifactPhase(artifact)) }, phaseLabel(D.artifactPhase(artifact))));
      })) : null,
      h('section', { className: 'card calendar-day-card' },
        pickedTasks.length ? pickedTasks.map(function (task) {
          var artifact = task.artifactId ? D.findArtifact(q.data, task.artifactId) : null;
          return h('div', { className: 'calendar-task-wrap', key: task.weekId + task.id },
            h(Task, { x: task, toggle: q.toggleTask, edit: task.readonly ? null : q.editTask }),
            artifact && h('button', { className: 'task-artifact-link', onClick: function () { q.openArtifact(artifact.id); } }, I('briefcase', 12), artifact.title)
          );
        }) : h('p', { className: 'empty-day' }, 'Ngày này chưa có tác vụ.'),
        picked >= q.w.startDate && picked <= q.w.endDate && h('button', { className: 'add-row', onClick: function () { q.addTask('', picked); } }, I('plus', 17), 'Thêm tác vụ vào ngày này')
      )
    );
  };

  U.Nav = function Nav(q) {
    function button(view, icon, label) {
      return h('button', { className: q.v === view ? 'active' : '', onClick: function () { q.go(view); } }, I(icon, 21, 2), h('span', null, label));
    }
    return h('nav', { className: 'nav nav-v2' },
      button('dashboard', 'home', 'Trang chủ'),
      button('goals', 'goal', 'Mục tiêu'),
      button('calendar', 'cal', 'Lịch'),
      button('artifacts', 'briefcase', 'Artifact'),
      button('routines', 'routine', 'Routine'),
      button('progress', 'chart', 'Thống kê')
    );
  };
}(window));
