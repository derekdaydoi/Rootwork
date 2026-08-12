/* Rootwork — store.js
   Đọc ghi localStorage, chuẩn hoá và nâng cấp schema. Không chứa nghiệp vụ
   OKR, không chứa giao diện.

   Cùng pattern với Rootflow/store.js. */
(function (global) {
  'use strict';

  var D = global.RootworkDomain;

  var KEY = 'rootwork:v1';
  var SCHEMA = 4;
  var BACKUP_FORMAT = 'rootwork-backup';
  var TRASH_DAYS = 30;
  var WARN_BYTES = 3 * 1024 * 1024;

  function uid() {
    if (global.crypto && typeof global.crypto.randomUUID === 'function') {
      return global.crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function now() { return new Date().toISOString(); }

  function str(v, fallback) {
    var t = typeof v === 'string' ? v.trim() : '';
    return t || fallback;
  }

  function empty() {
    return {
      schemaVersion: SCHEMA,
      objectives: [],
      routines: [],
      loose: [],
      trash: [],
      meta: { updatedAt: now() }
    };
  }

  /* ======================= CHUẨN HOÁ BẢN GHI ======================= */

  function cleanMetric(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var target = Number(raw.target);
    if (!Number.isFinite(target) || target <= 0) return null;
    var current = Number(raw.current);
    return {
      current: Number.isFinite(current) ? current : 0,
      target: target,
      unit: str(raw.unit, '')
    };
  }

  /* v2 có field `type: fixed|flex` nhưng UI chưa bao giờ ghi vào. v3 thay bằng
     cặp date + time: không ngày = kho · có ngày, không giờ = linh hoạt trong
     ngày · có ngày + giờ = cố định.

     v4 vứt bỏ mọi field thừa lọt vào từ task đã flatten (loose/source/krTitle/
     objId/krId) — chúng từng bị ghi vào cây qua đường khôi phục thùng rác. */
  function cleanTask(raw, monday) {
    var t = raw && typeof raw === 'object' ? raw : {};
    var date = D.isIsoDate(t.date) ? t.date : null;
    if (!date && typeof t.day === 'number' && t.day >= 0 && t.day <= 6) {
      date = D.addDays(monday, t.day);
    }
    return {
      id: str(t.id, uid()),
      title: str(t.title, 'Việc chưa đặt tên'),
      note: typeof t.note === 'string' ? t.note : '',
      priority: t.priority === 'high' ? 'high' : 'low',
      done: Boolean(t.done),
      date: date,
      time: D.isTime(t.time) ? t.time : null
    };
  }

  function cleanRoutine(raw) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var log = {};
    if (item.log && typeof item.log === 'object' && !Array.isArray(item.log)) {
      Object.keys(item.log).forEach(function (k) {
        if (D.isIsoDate(k) && item.log[k]) log[k] = true;
      });
    }
    var target = Number(item.target);
    return {
      id: str(item.id, uid()),
      name: str(item.name, 'Thói quen chưa đặt tên'),
      target: D.clamp(Number.isFinite(target) ? Math.round(target) : 3, 1, 7),
      log: log
    };
  }

  function cleanObjective(raw, monday) {
    var item = raw && typeof raw === 'object' ? raw : {};
    return {
      id: str(item.id, uid()),
      title: str(item.title, 'Objective chưa đặt tên'),
      deadline: D.isIsoDate(item.deadline) ? item.deadline : null,
      archived: Boolean(item.archived),
      krs: Array.isArray(item.krs) ? item.krs.map(function (k) {
        var kr = k && typeof k === 'object' ? k : {};
        return {
          id: str(kr.id, uid()),
          title: str(kr.title, 'Key Result chưa đặt tên'),
          metric: cleanMetric(kr.metric),
          tasks: Array.isArray(kr.tasks)
            ? kr.tasks.map(function (t) { return cleanTask(t, monday); })
            : []
        };
      }) : []
    };
  }

  function cleanTrash(raw, monday) {
    var cutoff = Date.now() - TRASH_DAYS * D.DAY;
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (e) {
      return e && typeof e === 'object' && e.payload &&
        Number.isFinite(Date.parse(e.deletedAt)) && Date.parse(e.deletedAt) > cutoff;
    }).map(function (e) {
      var out = {
        id: str(e.id, uid()),
        deletedAt: e.deletedAt,
        kind: ['task', 'kr', 'objective', 'routine'].indexOf(e.kind) >= 0 ? e.kind : 'task',
        label: str(e.label, 'Mục đã xoá'),
        payload: e.payload
      };
      if (e.objId) out.objId = e.objId;
      if (out.kind === 'task') out.payload = cleanTask(e.payload, monday);
      if (out.kind === 'routine') out.payload = cleanRoutine(e.payload);
      if (out.kind === 'objective') out.payload = cleanObjective(e.payload, monday);
      return out;
    });
  }

  /* ======================= MIGRATION ======================= */

  /* Chuỗi nâng cấp có version thật. Trước v4 hàm này chỉ ép kiểu và không hề
     đọc schemaVersion — nghĩa là mọi thay đổi schema về sau đều không có chỗ
     bám. Mỗi bậc là một hàm nhận data cũ trả data mới; thêm bậc mới thì thêm
     một entry, không sửa entry cũ. */
  var STEPS = {
    /* 1 → 2: routines chuyển từ mảng ngày sang map log theo ngày. */
    1: function (d) {
      (d.routines || []).forEach(function (r) {
        if (Array.isArray(r.log)) {
          var map = {};
          r.log.forEach(function (k) { if (typeof k === 'string') map[k] = true; });
          r.log = map;
        }
      });
      return d;
    },
    /* 2 → 3: task bỏ `type: fixed|flex` và `day`, dùng cặp date + time.
       Phải tự quy đổi day → date TẠI ĐÂY rồi mới gỡ field: nếu chỉ delete,
       cleanTask chạy sau sẽ không còn gì để đọc và task cũ mất lịch. */
    2: function (d) {
      var monday = D.mondayOf(D.today());
      eachTask(d, function (t) {
        if (!D.isIsoDate(t.date) && typeof t.day === 'number' && t.day >= 0 && t.day <= 6) {
          t.date = D.addDays(monday, t.day);
        }
        delete t.type;
        delete t.day;
      });
      return d;
    },
    /* 3 → 4: gỡ field của task đã flatten lọt vào cây qua đường khôi phục
       thùng rác ở các bản trước. */
    3: function (d) {
      eachTask(d, function (t) {
        delete t.loose; delete t.source; delete t.krTitle;
        delete t.objId; delete t.krId;
      });
      return d;
    }
  };

  function eachTask(d, fn) {
    (d.objectives || []).forEach(function (o) {
      (o.krs || []).forEach(function (kr) { (kr.tasks || []).forEach(fn); });
    });
    (d.loose || []).forEach(fn);
    (d.trash || []).forEach(function (e) {
      if (e && e.kind === 'task' && e.payload) fn(e.payload);
    });
  }

  function migrate(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Dữ liệu không đúng định dạng Rootwork.');
    }

    var data = raw;
    var from = Number(data.schemaVersion) || 1;
    for (var v = from; v < SCHEMA; v += 1) {
      if (STEPS[v]) data = STEPS[v](data);
    }

    var monday = D.mondayOf(D.today());
    return {
      schemaVersion: SCHEMA,
      objectives: Array.isArray(data.objectives)
        ? data.objectives.map(function (o) { return cleanObjective(o, monday); }) : [],
      routines: Array.isArray(data.routines) ? data.routines.map(cleanRoutine) : [],
      loose: Array.isArray(data.loose)
        ? data.loose.map(function (t) { return cleanTask(t, monday); }) : [],
      trash: cleanTrash(data.trash, monday),
      meta: {
        updatedAt: data.meta && typeof data.meta.updatedAt === 'string'
          ? data.meta.updatedAt : now()
      }
    };
  }

  /* ======================= LOCALSTORAGE ======================= */

  function writable() {
    var k = 'rootwork:test:' + Date.now();
    try {
      global.localStorage.setItem(k, '1');
      global.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function load() {
    var raw = global.localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  }

  function save(data) {
    var payload = JSON.stringify(data);
    global.localStorage.setItem(KEY, payload);
    return payload.length;
  }

  function sizeOf() {
    var raw = global.localStorage.getItem(KEY);
    return raw ? raw.length : 0;
  }

  function nearLimit() { return sizeOf() > WARN_BYTES; }

  /* ======================= SAO LƯU ======================= */

  function exportBackup(data) {
    var payload = JSON.stringify({
      format: BACKUP_FORMAT,
      app: 'Rootwork',
      schemaVersion: SCHEMA,
      exportedAt: now(),
      data: data
    }, null, 2);

    var blob = new Blob([payload], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'rootwork-backup-' + D.today() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* Guard bắt buộc. Không có nó, một file rootflow-backup-*.json nạp vào đây
     sẽ đi qua migrate êm ru, trả về state rỗng hợp lệ và ghi đè toàn bộ dữ
     liệu thật — cửa sổ hoàn tác chỉ 6 giây. Hai app cùng tiền tố "Root", cùng
     xuất .json, cùng nằm trong Downloads: đây là chuyện sẽ xảy ra, không phải
     có thể xảy ra. */
  function importBackup(file, cb) {
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { cb('Không đọc được tệp.'); };
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (e) {
        return cb('Tệp không phải JSON hợp lệ.');
      }
      if (!parsed || typeof parsed !== 'object') {
        return cb('Tệp không phải bản sao lưu Rootwork.');
      }
      if (parsed.format !== BACKUP_FORMAT) {
        var other = parsed.format === 'rootflow-backup' ? ' Đây là bản sao lưu của Rootflow.' : '';
        return cb('Tệp này không phải bản sao lưu Rootwork.' + other);
      }
      if (Number(parsed.schemaVersion) > SCHEMA) {
        return cb('Bản sao lưu tạo bởi phiên bản Rootwork mới hơn. Cập nhật app trước khi nạp.');
      }
      try {
        return cb(null, migrate(parsed.data));
      } catch (e) {
        return cb('Bản sao lưu hỏng cấu trúc, không nạp được.');
      }
    };
    reader.readAsText(file);
  }

  global.RootworkStore = {
    KEY: KEY,
    SCHEMA: SCHEMA,
    TRASH_DAYS: TRASH_DAYS,
    BACKUP_FORMAT: BACKUP_FORMAT,

    uid: uid,
    now: now,
    empty: empty,
    migrate: migrate,
    cleanTask: cleanTask,

    writable: writable,
    load: load,
    save: save,
    sizeOf: sizeOf,
    nearLimit: nearLimit,

    exportBackup: exportBackup,
    importBackup: importBackup
  };
}(window));
