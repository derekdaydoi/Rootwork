(function (g) {
  'use strict';

  var U = g.RootworkUI;
  var R = U.R;
  var RD = g.ReactDOM;
  var D = U.D;
  var S = U.S;
  var h = U.h;
  var F = R.Fragment;
  var I = U.I;
  var Logo = U.Logo;
  var Frame = U.Frame;
  var Field = U.Field;

  function Splash() {
    return h('div', { className: 'splash', role: 'status', 'aria-label': 'Rootwork đang khởi động' },
      h('div', { className: 'splash-lock' },
        Logo('splash-logo'),
        h('strong', null, 'Rootwork'),
        h('p', null, 'Nhỏ hôm nay, lớn ngày mai'),
        h('div', { className: 'splash-loader', 'aria-hidden': 'true' }, h('span', null, h('i')), h('small', null, 'Đang khởi động...'))
      ),
      h('small', { className: 'splash-copyright' }, '© 2026 Rootwork · @derekdaydoi')
    );
  }

  function Top(q) {
    return h('header', { className: 'top' },
      h('div', { className: 'brand' }, Logo('brand-logo'), h('strong', null, 'Rootwork')),
      h('button', { className: 'icon-btn', onClick: q.settings, 'aria-label': 'Cài đặt' }, I('settings', 21))
    );
  }

  function GoalModal(q) {
    var src = q.m.goal || null;
    var editing = Boolean(src);
    var a = R.useState(src ? src.title : '');
    var title = a[0], setTitle = a[1];
    var b = R.useState(src ? (src.description || '') : '');
    var desc = b[0], setDesc = b[1];

    function remove() {
      if (!src || !g.confirm('Xoá mục tiêu này và toàn bộ tác vụ bên trong?')) return;
      q.deleteGoal(src.id);
      q.close();
    }

    return h(Frame, { title: editing ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới', close: q.close },
      h('form', { className: 'form', onSubmit: function (e) {
        e.preventDefault();
        if (!title.trim()) return;
        if (editing) q.updateGoal(src.id, { title: title.trim(), description: desc.trim() });
        else q.addGoal(title.trim(), desc.trim());
        q.close();
      } },
        Field('Tiêu đề mục tiêu', h('input', { autoFocus: true, value: title, onChange: function (e) { setTitle(e.target.value); } })),
        Field('Mô tả', h('textarea', { rows: 3, value: desc, onChange: function (e) { setDesc(e.target.value); } })),
        h('button', { className: 'primary' }, editing ? 'Lưu thay đổi' : 'Tạo mục tiêu'),
        editing && h('button', { type: 'button', className: 'danger-button', onClick: remove }, 'Xoá mục tiêu')
      )
    );
  }

  function TaskModal(q) {
    var src = q.m.task || null;
    var editing = Boolean(src);
    var a = R.useState(src ? src.title : '');
    var title = a[0], setTitle = a[1];
    var b = R.useState(src ? (src.targetId || '') : (q.m.targetId || ''));
    var target = b[0], setTarget = b[1];
    var c = R.useState(src ? (src.date || '') : (q.m.date || ''));
    var date = c[0], setDate = c[1];
    var d = R.useState(src ? (src.priority || 'normal') : 'normal');
    var priority = d[0], setPriority = d[1];
    var e0 = R.useState(src ? (src.note || '') : '');
    var note = e0[0], setNote = e0[1];
    var f = R.useState(src ? (src.time || '') : '');
    var time = f[0], setTime = f[1];
    var z = R.useState(src ? (src.artifactId || '') : (q.m.artifactId || ''));
    var artifactId = z[0], setArtifactId = z[1];
    var artifacts = (q.data.artifacts || []).filter(function (artifact) {
      return artifact.state !== 'cancelled';
    });

    function remove() {
      if (!src || !g.confirm('Xoá tác vụ này?')) return;
      q.deleteTask(src);
      q.close();
    }

    return h(Frame, { title: editing ? 'Sửa tác vụ' : 'Tác vụ tuần', close: q.close },
      h('form', { className: 'form', onSubmit: function (e) {
        e.preventDefault();
        if (!title.trim()) return;
        var payload = {
          title: title.trim(),
          targetId: target,
          artifactId: artifactId || null,
          date: date,
          priority: priority,
          note: note.trim(),
          time: date ? time : ''
        };
        if (editing) q.updateTask(src, payload);
        else q.addTask(payload);
        q.close();
      } },
        Field('Tác vụ', h('input', { autoFocus: true, value: title, onChange: function (e) { setTitle(e.target.value); } })),
        Field('Ghi chú', h('textarea', { rows: 2, value: note, onChange: function (e) { setNote(e.target.value); } })),
        Field('Mục tiêu', h('select', { value: target, onChange: function (e) { setTarget(e.target.value); } },
          h('option', { value: '' }, 'Tác vụ tuần độc lập'),
          (q.w.targets || []).filter(function (x) { return x.status !== 'removed'; }).map(function (x) {
            return h('option', { key: x.id, value: x.id }, x.title);
          })
        )),
        Field('Artifact · không bắt buộc', h('select', { value: artifactId, onChange: function (e) { setArtifactId(e.target.value); } },
          h('option', { value: '' }, 'Không thuộc Artifact'),
          artifacts.map(function (artifact) {
            return h('option', { key: artifact.id, value: artifact.id }, artifact.title);
          })
        )),
        Field('Ngày · không bắt buộc', h('input', { type: 'date', min: q.w.startDate, max: q.w.endDate, value: date, onChange: function (e) {
          var v = e.target.value;
          setDate(v);
          if (!v) setTime('');
        } })),
        Field('Giờ · không bắt buộc', h('input', { type: 'time', disabled: !date, value: time, onChange: function (e) { setTime(e.target.value); } })),
        h('div', { className: 'choice' },
          h('button', { type: 'button', className: priority === 'normal' ? 'active' : '', onClick: function () { setPriority('normal'); } }, 'Bình thường'),
          h('button', { type: 'button', className: priority === 'high' ? 'active' : '', onClick: function () { setPriority('high'); } }, 'Ưu tiên cao')
        ),
        h('button', { className: 'primary' }, editing ? 'Lưu thay đổi' : 'Thêm tác vụ tuần'),
        editing && h('button', { type: 'button', className: 'danger-button', onClick: remove }, 'Xoá tác vụ')
      )
    );
  }

  function ArtifactModal(q) {
    var src = q.m.artifact || null;
    var editing = Boolean(src);
    var a = R.useState(src ? src.title : '');
    var title = a[0], setTitle = a[1];
    var b = R.useState(src ? (src.description || '') : '');
    var description = b[0], setDescription = b[1];
    var c = R.useState(src ? src.startDate : D.today());
    var startDate = c[0], setStartDate = c[1];
    var d = R.useState(src ? src.endDate : D.addDays(D.today(), 6));
    var endDate = d[0], setEndDate = d[1];
    var e0 = R.useState(src ? (src.note || '') : '');
    var note = e0[0], setNote = e0[1];

    function remove() {
      if (!src || !g.confirm('Xoá Artifact này? Các tác vụ liên kết sẽ được giữ lại.')) return;
      q.deleteArtifact(src.id);
      q.close();
    }

    return h(Frame, { title: editing ? 'Sửa Artifact' : 'Tạo Artifact', close: q.close },
      h('form', { className: 'form artifact-form', onSubmit: function (e) {
        e.preventDefault();
        if (!title.trim() || !D.isIsoDate(startDate) || !D.isIsoDate(endDate)) return;
        if (endDate < startDate) return g.alert('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
        var payload = {
          title: title.trim(),
          description: description.trim(),
          note: note.trim(),
          startDate: startDate,
          endDate: endDate
        };
        if (editing) q.updateArtifact(src.id, payload);
        else q.addArtifact(payload);
        q.close();
      } },
        Field('Tên Artifact', h('input', { autoFocus: true, value: title, onChange: function (e) { setTitle(e.target.value); }, placeholder: 'Ví dụ: Rootwork Landing Page' })),
        Field('Mô tả', h('textarea', { rows: 3, value: description, onChange: function (e) { setDescription(e.target.value); }, placeholder: 'Thứ cụ thể đang được xây dựng là gì?' })),
        h('div', { className: 'date-pair' },
          Field('Bắt đầu', h('input', { type: 'date', value: startDate, onChange: function (e) { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); } })),
          Field('Kết thúc dự kiến', h('input', { type: 'date', min: startDate, value: endDate, onChange: function (e) { setEndDate(e.target.value); } }))
        ),
        Field('Ghi chú', h('textarea', { rows: 2, value: note, onChange: function (e) { setNote(e.target.value); } })),
        h('button', { className: 'primary' }, editing ? 'Lưu thay đổi' : 'Tạo Artifact'),
        editing && h('button', { type: 'button', className: 'danger-button', onClick: remove }, 'Xoá Artifact')
      )
    );
  }

  function RoutineModal(q) {
    var src = q.m.routine || null;
    var editing = Boolean(src);
    var a = R.useState(src ? src.name : '');
    var name = a[0], setName = a[1];
    var b = R.useState(src && src.recurrence ? src.recurrence.target : 3);
    var target = b[0], setTarget = b[1];
    var c = R.useState(src && src.recurrence ? src.recurrence.type : 'weekly');
    var type = c[0], setType = c[1];
    return h(Frame, { title: editing ? 'Sửa routine' : 'Tạo routine', close: q.close },
      h('form', { className: 'form', onSubmit: function (e) {
        e.preventDefault();
        if (!name.trim()) return;
        var finalTarget = type === 'daily' ? 7 : Math.max(1, Math.min(7, Number(target) || 3));
        if (editing) q.updateRoutine(src.id, { name: name.trim(), type: type, target: finalTarget });
        else q.addRoutine(name.trim(), finalTarget, type);
        q.close();
      } },
        Field('Tên routine', h('input', { autoFocus: true, value: name, onChange: function (e) { setName(e.target.value); }, placeholder: 'Ví dụ: Chạy bộ 30 phút' })),
        Field('Tần suất', h('select', { value: type, onChange: function (e) { setType(e.target.value); } }, h('option', { value: 'daily' }, 'Hàng ngày'), h('option', { value: 'weekly' }, 'Hàng tuần'))),
        type === 'weekly' && Field('Mục tiêu mỗi tuần', h('select', { value: target, onChange: function (e) { setTarget(Number(e.target.value)); } }, [1, 2, 3, 4, 5, 6, 7].map(function (n) { return h('option', { value: n, key: n }, n + ' lần'); }))),
        h('button', { className: 'primary' }, editing ? 'Lưu thay đổi' : 'Thêm routine')
      )
    );
  }

  function Settings(q) {
    var f = R.useRef(null);
    return h(Frame, { title: 'Cài đặt & dữ liệu', close: q.close },
      h('div', { className: 'settings' },
        h('button', { className: 'secondary', onClick: function () { S.exportBackup(q.data); } }, 'Xuất bản sao lưu'),
        h('input', { ref: f, type: 'file', accept: '.json,application/json', className: 'hidden', onChange: function (e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          S.importBackup(file, function (err, x) {
            if (err) return g.alert(err);
            try { S.save(D.ensureCurrentWeek(x)); g.location.reload(); }
            catch (ex) { g.alert(ex.message); }
          });
        } }),
        h('button', { className: 'secondary', onClick: function () { if (f.current) f.current.click(); } }, 'Khôi phục bản sao lưu'),
        h('p', null, 'Rootwork là local-first. Hãy xuất backup trước khi xoá dữ liệu trình duyệt hoặc đổi domain.')
      )
    );
  }

  function Modals(q) {
    if (q.m.type === 'goal') return h(GoalModal, q);
    if (q.m.type === 'task') return h(TaskModal, q);
    if (q.m.type === 'artifact') return h(ArtifactModal, q);
    if (q.m.type === 'routine') return h(RoutineModal, q);
    if (q.m.type === 'settings') return h(Settings, q);
    return null;
  }

  function App() {
    var ds = R.useState(null), data = ds[0], setData = ds[1];
    var vs = R.useState('dashboard'), view = vs[0], setView = vs[1];
    var as = R.useState(null), selectedArtifactId = as[0], setSelectedArtifactId = as[1];
    var ms = R.useState(null), modal = ms[0], setModal = ms[1];
    var ls = R.useState(true), launch = ls[0], setLaunch = ls[1];
    var ref = R.useRef(null);

    R.useEffect(function () {
      var n;
      try { n = D.ensureCurrentWeek(S.load() || S.empty()); }
      catch (e) { n = D.ensureCurrentWeek(S.empty()); }
      var w = D.currentWeek(n);
      if (w && w.phase !== 'active') {
        w.phase = 'active';
        w.status = 'active';
        w.startedAt = w.startedAt || S.now();
        w.targets = (w.targets || []).filter(function (x) { return x.status !== 'removed'; });
      }
      n.artifacts = n.artifacts || [];
      ref.current = n;
      setData(n);
      try { S.save(n); } catch (e) {}
      var tm = setTimeout(function () { setLaunch(false); }, 1900);
      return function () { clearTimeout(tm); };
    }, []);

    function mut(fn) {
      if (!ref.current) return;
      var n = D.clone(ref.current);
      fn(n);
      n.schemaVersion = S.SCHEMA;
      n.meta = Object.assign({}, n.meta || {}, { updatedAt: S.now() });
      ref.current = n;
      setData(n);
      try { S.save(n); } catch (e) {}
    }

    function addTrash(n, kind, label, payload, weekId, targetId) {
      n.trash = n.trash || [];
      n.trash.unshift({
        id: S.uid(),
        deletedAt: S.now(),
        kind: kind,
        label: label,
        weekId: weekId || null,
        targetId: targetId || null,
        payload: D.clone(payload)
      });
    }

    function toggleTask(x) {
      mut(function (n) {
        var t = D.findTask(n, x);
        if (t) { t.done = !t.done; t.completedAt = t.done ? S.now() : null; }
      });
    }

    function addGoal(a, b) {
      mut(function (n) {
        D.currentWeek(n).targets.push({ id: S.uid(), title: a, description: b || '', status: 'active', tasks: [] });
      });
    }

    function updateGoal(id, x) {
      mut(function (n) {
        var w = D.currentWeek(n);
        var goal = w && (w.targets || []).find(function (item) { return item.id === id; });
        if (!goal) return;
        goal.title = x.title;
        goal.description = x.description || '';
      });
    }

    function deleteGoal(id) {
      mut(function (n) {
        var w = D.currentWeek(n);
        if (!w) return;
        var index = (w.targets || []).findIndex(function (item) { return item.id === id; });
        if (index < 0) return;
        var goal = w.targets[index];
        addTrash(n, 'target', goal.title, goal, w.id, goal.id);
        w.targets.splice(index, 1);
      });
    }

    function addTask(x) {
      mut(function (n) {
        D.attachTask(D.currentWeek(n), x.targetId || null, {
          id: S.uid(),
          title: x.title,
          note: x.note || '',
          priority: x.priority === 'high' ? 'high' : 'normal',
          done: false,
          date: x.date || null,
          time: x.date && x.time ? x.time : null,
          artifactId: x.artifactId || null,
          completedAt: null
        });
      });
    }

    function updateTask(reference, x) {
      mut(function (n) {
        var week = D.findWeek(n, reference.weekId);
        var task = D.findTask(n, reference);
        if (!week || !task) return;
        var next = Object.assign({}, task, {
          title: x.title,
          note: x.note || '',
          priority: x.priority === 'high' ? 'high' : 'normal',
          date: x.date || null,
          time: x.date && x.time ? x.time : null,
          artifactId: x.artifactId || null
        });
        var oldTarget = reference.targetId || '';
        var newTarget = x.targetId || '';
        if (oldTarget !== newTarget) {
          D.detachTask(week, reference);
          D.attachTask(week, newTarget || null, next);
        } else {
          Object.assign(task, next);
        }
      });
    }

    function deleteTask(reference) {
      mut(function (n) {
        var week = D.findWeek(n, reference.weekId);
        var task = D.findTask(n, reference);
        if (!week || !task) return;
        addTrash(n, 'task', task.title, task, week.id, reference.targetId || null);
        D.detachTask(week, reference);
      });
    }

    function addArtifact(x) {
      var id = S.uid();
      mut(function (n) {
        n.artifacts = n.artifacts || [];
        n.artifacts.push({
          id: id,
          title: x.title,
          description: x.description || '',
          note: x.note || '',
          startDate: x.startDate,
          endDate: x.endDate,
          state: 'open',
          createdAt: S.now(),
          completedAt: null,
          cancelledAt: null
        });
      });
      setSelectedArtifactId(id);
    }

    function updateArtifact(id, x) {
      mut(function (n) {
        var artifact = D.findArtifact(n, id);
        if (!artifact) return;
        artifact.title = x.title;
        artifact.description = x.description || '';
        artifact.note = x.note || '';
        artifact.startDate = x.startDate;
        artifact.endDate = x.endDate;
      });
    }

    function setArtifactState(id, state) {
      mut(function (n) {
        var artifact = D.findArtifact(n, id);
        if (!artifact) return;
        artifact.state = state;
        artifact.completedAt = state === 'completed' ? S.now() : null;
        artifact.cancelledAt = state === 'cancelled' ? S.now() : null;
      });
    }

    function deleteArtifact(id) {
      mut(function (n) {
        var index = (n.artifacts || []).findIndex(function (artifact) { return artifact.id === id; });
        if (index < 0) return;
        var artifact = n.artifacts[index];
        addTrash(n, 'artifact', artifact.title, artifact, null, null);
        n.artifacts.splice(index, 1);
        (n.weeks || []).forEach(function (week) {
          (week.targets || []).forEach(function (target) {
            (target.tasks || []).forEach(function (task) { if (task.artifactId === id) task.artifactId = null; });
          });
          (week.looseTasks || []).forEach(function (task) { if (task.artifactId === id) task.artifactId = null; });
        });
      });
      if (selectedArtifactId === id) { setSelectedArtifactId(null); setView('artifacts'); }
    }

    function addRoutine(name, target, type) {
      mut(function (n) {
        n.routines = n.routines || [];
        n.routines.push({ id: S.uid(), name: name, recurrence: { type: type === 'daily' ? 'daily' : 'weekly', target: type === 'daily' ? 7 : Math.max(1, Math.min(7, Number(target) || 3)) }, log: {} });
      });
    }

    function updateRoutine(id, x) {
      mut(function (n) {
        var r = (n.routines || []).find(function (item) { return item.id === id; });
        if (!r) return;
        r.name = x.name;
        r.recurrence = { type: x.type === 'daily' ? 'daily' : 'weekly', target: x.type === 'daily' ? 7 : Math.max(1, Math.min(7, Number(x.target) || 3)) };
      });
    }

    function toggleRoutine(id, date) {
      mut(function (n) {
        var r = (n.routines || []).find(function (x) { return x.id === id; });
        if (!r) return;
        r.log = r.log || {};
        if (r.log[date]) delete r.log[date];
        else r.log[date] = true;
      });
    }

    if (!data) return h(Splash);

    var w = D.currentWeek(data);
    var artifact = selectedArtifactId ? D.findArtifact(data, selectedArtifactId) : null;
    var p = {
      data: data,
      w: w,
      artifact: artifact,
      go: function (v) { setView(v); g.scrollTo(0, 0); },
      backFromArtifact: function () { setView('artifacts'); g.scrollTo(0, 0); },
      openArtifact: function (id) { setSelectedArtifactId(id); setView('artifact-detail'); g.scrollTo(0, 0); },
      toggleTask: toggleTask,
      toggleRoutine: toggleRoutine,
      addGoal: function () { setModal({ type: 'goal' }); },
      editGoal: function (x) { setModal({ type: 'goal', goal: x }); },
      addTask: function (id, date, artifactId) { setModal({ type: 'task', targetId: id || '', date: date || '', artifactId: artifactId || '' }); },
      editTask: function (x) { setModal({ type: 'task', task: x, targetId: x.targetId || '', date: x.date || '', artifactId: x.artifactId || '' }); },
      addArtifact: function () { setModal({ type: 'artifact' }); },
      editArtifact: function (x) { setModal({ type: 'artifact', artifact: x }); },
      completeArtifact: function (id) { setArtifactState(id, 'completed'); },
      reopenArtifact: function (id) { setArtifactState(id, 'open'); },
      pauseArtifact: function (id) { setArtifactState(id, 'paused'); },
      addRoutine: function () { setModal({ type: 'routine' }); },
      editRoutine: function (r) { setModal({ type: 'routine', routine: r }); }
    };

    var V = {
      dashboard: U.Dashboard,
      goals: U.Goals,
      calendar: U.Calendar,
      artifacts: U.Artifacts,
      'artifact-detail': U.ArtifactDetail,
      routines: U.Routines,
      progress: U.Progress
    };
    var Current = V[view] || U.Dashboard;

    return h(F, null,
      launch && h(Splash),
      h('main', { className: 'shell' },
        view === 'dashboard' && h(Top, { settings: function () { setModal({ type: 'settings' }); } }),
        h(Current, p)
      ),
      h(U.Nav, { v: view === 'artifact-detail' ? 'artifacts' : view, go: p.go }),
      modal && h(Modals, {
        m: modal,
        data: data,
        w: w,
        close: function () { setModal(null); },
        addGoal: addGoal,
        updateGoal: updateGoal,
        deleteGoal: deleteGoal,
        addTask: addTask,
        updateTask: updateTask,
        deleteTask: deleteTask,
        addArtifact: addArtifact,
        updateArtifact: updateArtifact,
        deleteArtifact: deleteArtifact,
        addRoutine: addRoutine,
        updateRoutine: updateRoutine
      })
    );
  }

  var mount = document.getElementById('root');
  if (RD.createRoot) RD.createRoot(mount).render(h(App));
  else RD.render(h(App), mount);
  if ('serviceWorker' in navigator) g.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
}(window));
