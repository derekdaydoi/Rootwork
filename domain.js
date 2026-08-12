/* Rootwork — domain.js
   Toàn bộ nghiệp vụ OKR, lịch và thói quen. Hàm thuần: không đụng DOM,
   không đụng storage, không đụng React. Mọi thứ ở đây test được bằng
   assertion mà không cần mở browser.

   Cùng pattern với Rootflow/domain.js để hai repo đọc như một. */
(function (global) {
  'use strict';

  var DAY = 86400000;
  var DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  /* ============================ NGÀY ============================ */

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* Không dùng toISOString() trực tiếp: nó quy về UTC và làm lệch một ngày
     với mọi múi giờ phía đông. Đọc theo giờ local rồi tự ghép chuỗi. */
  function ymd(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseYmd(s) {
    var p = String(s || '').split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function today() { return ymd(new Date()); }

  function isIsoDate(v) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    return !Number.isNaN(parseYmd(v).getTime());
  }

  function isTime(v) { return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v); }

  function addDays(s, n) {
    var d = parseYmd(s);
    d.setDate(d.getDate() + n);
    return ymd(d);
  }

  function diffDays(a, b) {
    return Math.round((parseYmd(a) - parseYmd(b)) / DAY);
  }

  /* Tuần bắt đầu Thứ Hai. */
  function mondayOf(s) {
    var d = parseYmd(s || today());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return ymd(d);
  }

  function weekDates(monday) {
    return DOW.map(function (_, i) { return addDays(monday, i); });
  }

  function daysFromToday(s) {
    if (!isIsoDate(s)) return null;
    return diffDays(s, today());
  }

  /* ============================ ĐỊNH DẠNG ============================ */

  function fmtDate(s) {
    if (!isIsoDate(s)) return 'Chưa xếp';
    if (s === today()) return 'Hôm nay';
    if (s === addDays(today(), 1)) return 'Ngày mai';
    if (s === addDays(today(), -1)) return 'Hôm qua';
    return parseYmd(s).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  }

  function fmtDateFull(s) {
    if (!isIsoDate(s)) return 'Chưa xếp';
    return parseYmd(s).toLocaleDateString('vi-VN',
      { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtWeekRange(monday) {
    return parseYmd(monday).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }) +
      ' – ' + parseYmd(addDays(monday, 6))
        .toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function fmtToday() {
    var t = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function deadlineLabel(s) {
    var d = daysFromToday(s);
    if (d === null) return { text: 'Chưa đặt hạn', tone: '' };
    if (d < 0) return { text: 'Quá hạn ' + Math.abs(d) + ' ngày', tone: 'overdue' };
    if (d === 0) return { text: 'Hạn hôm nay', tone: 'soon' };
    if (d <= 7) return { text: 'Còn ' + d + ' ngày', tone: 'soon' };
    return {
      text: 'Hạn ' + parseYmd(s).toLocaleDateString('vi-VN',
        { day: 'numeric', month: 'short', year: 'numeric' }),
      tone: ''
    };
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ============================ CÂY DỮ LIỆU ============================ */

  /* Task ở dạng "phẳng" mang thêm toạ độ (objId/krId) và nhãn hiển thị.
     Đây là view, không phải bản ghi — không bao giờ được ghi ngược vào cây
     hay vào thùng rác. Dùng bare() để lấy lại bản ghi sạch. */
  var TASK_FIELDS = ['id', 'title', 'note', 'priority', 'done', 'date', 'time'];

  function bare(task) {
    var out = {};
    TASK_FIELDS.forEach(function (k) { out[k] = task[k]; });
    return out;
  }

  function flatten(data) {
    var out = [];
    (data.objectives || []).forEach(function (o) {
      if (o.archived) return;
      (o.krs || []).forEach(function (kr) {
        (kr.tasks || []).forEach(function (t) {
          out.push(Object.assign({}, t, {
            loose: false, objId: o.id, krId: kr.id, source: o.title, krTitle: kr.title
          }));
        });
      });
    });
    (data.loose || []).forEach(function (t) {
      out.push(Object.assign({}, t, { loose: true, source: 'Phát sinh', krTitle: '' }));
    });
    return out;
  }

  function findTask(data, task) {
    if (task.loose) return (data.loose || []).find(function (i) { return i.id === task.id; });
    var o = (data.objectives || []).find(function (i) { return i.id === task.objId; });
    var kr = o && (o.krs || []).find(function (i) { return i.id === task.krId; });
    return kr && (kr.tasks || []).find(function (i) { return i.id === task.id; });
  }

  function detachTask(draft, task) {
    if (task.loose) {
      draft.loose = draft.loose.filter(function (i) { return i.id !== task.id; });
      return;
    }
    var o = draft.objectives.find(function (i) { return i.id === task.objId; });
    var kr = o && o.krs.find(function (i) { return i.id === task.krId; });
    if (kr) kr.tasks = kr.tasks.filter(function (i) { return i.id !== task.id; });
  }

  /* dest là 'loose' hoặc 'objId::krId'. KR biến mất thì rơi về loose,
     không làm mất task. */
  function attachTask(draft, dest, task) {
    if (dest === 'loose') { draft.loose.push(task); return; }
    var parts = String(dest).split('::');
    var o = draft.objectives.find(function (i) { return i.id === parts[0]; });
    var kr = o && o.krs.find(function (i) { return i.id === parts[1]; });
    if (kr) kr.tasks.push(task); else draft.loose.push(task);
  }

  function destOf(task) {
    return task.loose ? 'loose' : task.objId + '::' + task.krId;
  }

  /* ============================ SẮP XẾP ============================ */

  /* Thứ tự trong ngày: chưa xong trước → có giờ trước → giờ sớm trước →
     ưu tiên cao trước. */
  function sortDay(list) {
    return list.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (Boolean(a.time) !== Boolean(b.time)) return a.time ? -1 : 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
      return 0;
    });
  }

  /* ============================ TIẾN ĐỘ ============================ */

  /* KR có chỉ số thì đo bằng chỉ số. Không có thì suy ra từ tỉ lệ task xong —
     kém chính xác hơn, nên UI phải mời người dùng đặt chỉ số. */
  function krPercent(kr) {
    if (kr.metric && kr.metric.target > 0) {
      return clamp(Math.round(kr.metric.current / kr.metric.target * 100), 0, 100);
    }
    var tasks = kr.tasks || [];
    if (!tasks.length) return 0;
    return Math.round(tasks.filter(function (t) { return t.done; }).length / tasks.length * 100);
  }

  /* Trung bình cộng các KR, không trọng số. Objective không có KR = 0%,
     không phải 100% — chưa định nghĩa được thì chưa đạt được. */
  function objectivePercent(o) {
    var krs = o.krs || [];
    if (!krs.length) return 0;
    return Math.round(krs.reduce(function (s, kr) { return s + krPercent(kr); }, 0) / krs.length);
  }

  function overallPercent(data) {
    var live = (data.objectives || []).filter(function (o) { return !o.archived; });
    if (!live.length) return 0;
    return Math.round(live.reduce(function (s, o) { return s + objectivePercent(o); }, 0) / live.length);
  }

  function overdue(data) {
    var t = today();
    return flatten(data)
      .filter(function (x) { return !x.done && x.date && x.date < t; })
      .sort(function (a, b) {
        if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
        return a.date.localeCompare(b.date);
      });
  }

  function unscheduled(data) {
    return flatten(data).filter(function (t) { return !t.date && !t.done; });
  }

  /* ============================ THÓI QUEN ============================ */

  /* Streak đếm theo TUẦN đạt target, không phải ngày liên tiếp — vì target là
     "n lần mỗi tuần". Đếm ngày liên tiếp luôn trả về 1 cho người đặt 3 lần/tuần
     rồi làm đúng 3 lần cách quãng, tức là phạt người dùng đúng.

     Tuần hiện tại chưa đủ target thì không tính là đứt: nó chưa kết thúc. */
  function routineHits(routine, monday) {
    return weekDates(monday).reduce(function (s, d) {
      return s + (routine.log && routine.log[d] ? 1 : 0);
    }, 0);
  }

  function weekStreak(routine) {
    var target = routine.target || 3;
    var monday = mondayOf(today());
    if (routineHits(routine, monday) < target) monday = addDays(monday, -7);
    var streak = 0;
    var guard = 0;
    while (routineHits(routine, monday) >= target && guard < 520) {
      streak += 1;
      monday = addDays(monday, -7);
      guard += 1;
    }
    return streak;
  }

  function routineTrend(data, monday, weeks) {
    var n = weeks || 8;
    return Array.from({ length: n }, function (_, k) {
      var m = addDays(monday, (k - (n - 1)) * 7);
      var hit = 0, target = 0;
      (data.routines || []).forEach(function (r) {
        target += r.target || 3;
        hit += routineHits(r, m);
      });
      return target ? clamp(Math.round(hit / target * 100), 0, 100) : 0;
    });
  }

  /* ============================ CHỈ SỐ TUẦN ============================ */

  function weekMetrics(data, monday) {
    var dates = weekDates(monday);
    var inWeek = {};
    dates.forEach(function (d) { inWeek[d] = true; });

    var tasks = flatten(data).filter(function (t) { return t.date && inWeek[t.date]; });
    var done = tasks.filter(function (t) { return t.done; }).length;
    var high = tasks.filter(function (t) { return t.priority === 'high'; });
    var highDone = high.filter(function (t) { return t.done; }).length;

    var targetTotal = 0, hits = 0;
    (data.routines || []).forEach(function (r) {
      targetTotal += r.target || 3;
      hits += routineHits(r, monday);
    });

    return {
      tasks: tasks,
      total: tasks.length,
      done: done,
      percent: tasks.length ? Math.round(done / tasks.length * 100) : 0,
      high: high,
      highDone: highDone,
      highPercent: high.length ? Math.round(highDone / high.length * 100) : 100,
      routinePercent: targetTotal ? clamp(Math.round(hits / targetTotal * 100), 0, 100) : 0
    };
  }

  /* Điểm nhịp: một số duy nhất để trả lời "tuần này có đang chạy không".
     Trọng số cố định ở một chỗ — trước đây Home và Week dùng hai công thức
     khác nhau (.5/.3/.2 và .55/.25/.20) nên hiển thị lệch nhau. */
  var RHYTHM_WEIGHTS = { done: 0.5, high: 0.3, routine: 0.2 };

  function rhythmScore(metrics) {
    return Math.round(
      metrics.percent * RHYTHM_WEIGHTS.done +
      metrics.highPercent * RHYTHM_WEIGHTS.high +
      metrics.routinePercent * RHYTHM_WEIGHTS.routine
    );
  }

  /* Tỉ lệ hoàn thành của một danh sách task bất kỳ. */
  function donePercent(list) {
    if (!list.length) return 0;
    return Math.round(list.filter(function (t) { return t.done; }).length / list.length * 100);
  }

  /* Mức lấp đầy thanh tiến độ của một thói quen trong tuần. Kẹp trần 100:
     làm 5/3 lần vẫn là đạt, không phải 167%. */
  function routineFill(hits, target) {
    return clamp(Math.round(hits / (target || 3) * 100), 0, 100);
  }

  /* Số ô sáng trên thanh 4 đoạn. 1–24% vẫn sáng 1 ô: có tiến độ phải nhìn thấy. */
  function segments(percent) {
    var v = clamp(Number(percent) || 0, 0, 100);
    return v === 0 ? 0 : clamp(Math.round(v / 25), 1, 4);
  }

  /* ============================ ĐIỂM CẦN CHÚ Ý ============================ */

  function attentionItems(data) {
    var out = [];
    var late = overdue(data);
    var open = unscheduled(data);
    if (late.length) {
      out.push({
        tone: 'danger', view: 'week',
        title: late.length + ' việc đã quá hạn',
        text: 'Xếp lại lịch hoặc bỏ những việc không còn đáng làm.'
      });
    }
    if (open.length) {
      out.push({
        tone: 'warning', view: 'week',
        title: open.length + ' việc chưa xếp lịch',
        text: 'Đưa vào một ngày cụ thể hoặc giữ trong backlog.'
      });
    }
    var near = (data.objectives || []).filter(function (o) {
      if (o.archived) return false;
      var d = daysFromToday(o.deadline);
      return d !== null && d >= 0 && d <= 7 && objectivePercent(o) < 100;
    });
    if (near.length) {
      out.push({
        tone: 'warning', view: 'targets',
        title: near.length + ' mục tiêu còn ≤ 7 ngày',
        text: 'Kiểm tra KR và việc còn lại trước hạn.'
      });
    }
    return out;
  }

  /* Objective đưa lên đầu Tổng quan: gần hạn nhất trước, chưa đặt hạn thì
     xếp theo tiến độ cao nhất. */
  function featuredObjective(data) {
    var live = (data.objectives || []).filter(function (o) { return !o.archived; });
    return live.slice().sort(function (a, b) {
      if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return objectivePercent(b) - objectivePercent(a);
    })[0] || null;
  }

  /* Việc tiếp theo: ưu tiên việc có giờ sắp tới, rồi việc ưu tiên cao. */
  function nextTask(data) {
    var t = today();
    var now = new Date().toTimeString().slice(0, 5);
    var pending = sortDay(flatten(data).filter(function (x) {
      return x.date === t && !x.done;
    }));
    return pending.find(function (x) { return x.time && x.time >= now; }) ||
      pending.find(function (x) { return x.priority === 'high'; }) ||
      pending[0] || null;
  }

  global.RootworkDomain = {
    DAY: DAY,
    DOW: DOW,
    RHYTHM_WEIGHTS: RHYTHM_WEIGHTS,
    TASK_FIELDS: TASK_FIELDS,

    ymd: ymd, parseYmd: parseYmd, today: today,
    isIsoDate: isIsoDate, isTime: isTime,
    addDays: addDays, diffDays: diffDays,
    mondayOf: mondayOf, weekDates: weekDates, daysFromToday: daysFromToday,

    fmtDate: fmtDate, fmtDateFull: fmtDateFull, fmtWeekRange: fmtWeekRange,
    fmtToday: fmtToday, deadlineLabel: deadlineLabel, clamp: clamp,

    bare: bare, flatten: flatten, findTask: findTask,
    detachTask: detachTask, attachTask: attachTask, destOf: destOf, sortDay: sortDay,

    krPercent: krPercent, objectivePercent: objectivePercent,
    overallPercent: overallPercent, overdue: overdue, unscheduled: unscheduled,

    routineHits: routineHits, weekStreak: weekStreak, routineTrend: routineTrend,

    weekMetrics: weekMetrics, rhythmScore: rhythmScore, segments: segments,
    donePercent: donePercent, routineFill: routineFill,
    attentionItems: attentionItems, featuredObjective: featuredObjective, nextTask: nextTask
  };
}(window));
