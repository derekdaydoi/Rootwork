/* Rootwork V2 — persistence, schema migration, and backup only. */
(function (global) {
  'use strict';

  var D = global.RootworkDomain;
  var KEY = 'rootwork:v1';
  var SCHEMA = 5;
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
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function str(value, fallback) {
    var text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
  }

  function empty() {
    return {
      schemaVersion: SCHEMA,
      profile: { name: 'Derek' },
      progress: { baseXp: 0 },
      weeks: [],
      routines: [],
      trash: [],
      legacyArchive: null,
      meta: { updatedAt: now() }
    };
  }

  function cleanTask(raw, monday) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var date = D.isIsoDate(item.date) ? item.date : null;
    if (!date && typeof item.day === 'number' && item.day >= 0 && item.day <= 6) {
      date = D.addDays(monday, item.day);
    }
    var done = Boolean(item.done);
    return {
      id: str(item.id, uid()),
      title: str(item.title, 'Untitled action'),
      note: typeof item.note === 'string' ? item.note : '',
      priority: item.priority === 'high' ? 'high' : 'normal',
      done: done,
      date: date,
      time: date && D.isTime(item.time) ? item.time : null,
      completedAt: done && typeof item.completedAt === 'string' ? item.completedAt : null
    };
  }

  function cleanRoutine(raw) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var log = {};
    if (Array.isArray(item.log)) {
      item.log.forEach(function (date) { if (D.isIsoDate(date)) log[date] = true; });
    } else if (item.log && typeof item.log === 'object') {
      Object.keys(item.log).forEach(function (date) {
        if (D.isIsoDate(date) && item.log[date]) log[date] = true;
      });
    }
    var sourceRecurrence = item.recurrence && typeof item.recurrence === 'object'
      ? item.recurrence : {};
    var type = sourceRecurrence.type === 'daily' ? 'daily' : 'weekly';
    var target = type === 'daily' ? 7 : D.clamp(
      Number(sourceRecurrence.target || item.target) || 3, 1, 7
    );
    return {
      id: str(item.id, uid()),
      name: str(item.name, 'Untitled routine'),
      recurrence: { type: type, target: Math.round(target) },
      log: log
    };
  }

  function cleanTarget(raw, monday) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var target = {
      id: str(item.id, uid()),
      title: str(item.title, 'Untitled target'),
      description: typeof item.description === 'string' ? item.description : '',
      status: item.status === 'removed' ? 'removed' : 'active',
      tasks: Array.isArray(item.tasks)
        ? item.tasks.map(function (task) { return cleanTask(task, monday); }) : []
    };
    if (typeof item.sourceTargetId === 'string') target.sourceTargetId = item.sourceTargetId;
    if (typeof item.sourceLegacyObjectiveId === 'string') {
      target.sourceLegacyObjectiveId = item.sourceLegacyObjectiveId;
    }
    return target;
  }

  function cleanRecap(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var number = function (value) {
      var result = Number(value);
      return Number.isFinite(result) ? Math.max(0, Math.round(result)) : 0;
    };
    return {
      completion: D.clamp(number(raw.completion), 0, 100),
      xpEarned: number(raw.xpEarned),
      totalActions: number(raw.totalActions),
      completedActions: number(raw.completedActions),
      targetsAdvanced: number(raw.targetsAdvanced),
      targetsStalled: number(raw.targetsStalled),
      targetsComplete: number(raw.targetsComplete),
      routineConsistency: D.clamp(number(raw.routineConsistency), 0, 100),
      routines: Array.isArray(raw.routines) ? raw.routines.map(function (routine) {
        return {
          id: str(routine && routine.id, uid()),
          name: str(routine && routine.name, 'Routine'),
          target: number(routine && routine.target),
          hits: number(routine && routine.hits),
          percent: D.clamp(number(routine && routine.percent), 0, 100),
          achieved: Boolean(routine && routine.achieved)
        };
      }) : []
    };
  }

  function cleanWeek(raw) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var start = D.isIsoDate(item.startDate) ? item.startDate : D.mondayOf(D.today());
    var status = ['setup', 'active', 'complete'].indexOf(item.status) >= 0 ? item.status : 'setup';
    var phase = ['greeting', 'review', 'recap', 'active', 'complete'].indexOf(item.phase) >= 0
      ? item.phase : (status === 'complete' ? 'complete' : 'greeting');
    var week = {
      id: str(item.id, 'week-' + start),
      startDate: start,
      endDate: D.addDays(start, 6),
      status: status,
      phase: phase,
      startedAt: typeof item.startedAt === 'string' ? item.startedAt : null,
      completedAt: typeof item.completedAt === 'string' ? item.completedAt : null,
      sourceWeekId: typeof item.sourceWeekId === 'string' ? item.sourceWeekId : null,
      targets: Array.isArray(item.targets)
        ? item.targets.map(function (target) { return cleanTarget(target, start); }) : [],
      looseTasks: Array.isArray(item.looseTasks)
        ? item.looseTasks.map(function (task) { return cleanTask(task, start); }) : [],
      recap: cleanRecap(item.recap)
    };
    if (item.importedLegacy) week.importedLegacy = true;
    return week;
  }

  function cleanMetric(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var target = Number(raw.target);
    if (!Number.isFinite(target) || target <= 0) return null;
    var current = Number(raw.current);
    return {
      current: Number.isFinite(current) ? current : 0,
      target: target,
      unit: typeof raw.unit === 'string' ? raw.unit : ''
    };
  }

  function cleanLegacyObjective(raw, monday) {
    var item = raw && typeof raw === 'object' ? raw : {};
    return {
      id: str(item.id, uid()),
      title: str(item.title, 'Untitled objective'),
      deadline: D.isIsoDate(item.deadline) ? item.deadline : null,
      archived: Boolean(item.archived),
      krs: Array.isArray(item.krs) ? item.krs.map(function (rawKr) {
        var kr = rawKr && typeof rawKr === 'object' ? rawKr : {};
        return {
          id: str(kr.id, uid()),
          title: str(kr.title, 'Untitled key result'),
          metric: cleanMetric(kr.metric),
          tasks: Array.isArray(kr.tasks)
            ? kr.tasks.map(function (task) { return cleanTask(task, monday); }) : []
        };
      }) : []
    };
  }

  function cleanTrash(raw, monday) {
    var cutoff = Date.now() - TRASH_DAYS * D.DAY;
    if (!Array.isArray(raw)) return [];
    return raw.filter(function (entry) {
      return entry && typeof entry === 'object' && entry.payload &&
        Number.isFinite(Date.parse(entry.deletedAt)) && Date.parse(entry.deletedAt) > cutoff;
    }).map(function (entry) {
      var kind = ['task', 'target', 'routine'].indexOf(entry.kind) >= 0 ? entry.kind : 'task';
      var result = {
        id: str(entry.id, uid()),
        deletedAt: entry.deletedAt,
        kind: kind,
        label: str(entry.label, 'Deleted item'),
        weekId: typeof entry.weekId === 'string' ? entry.weekId : null,
        targetId: typeof entry.targetId === 'string' ? entry.targetId : null,
        payload: entry.payload
      };
      if (kind === 'task') result.payload = cleanTask(entry.payload, monday);
      if (kind === 'target') result.payload = cleanTarget(entry.payload, monday);
      if (kind === 'routine') result.payload = cleanRoutine(entry.payload);
      return result;
    });
  }

  function eachLegacyTask(data, fn) {
    (data.objectives || []).forEach(function (objective) {
      (objective.krs || []).forEach(function (kr) {
        (kr.tasks || []).forEach(fn);
      });
    });
    (data.loose || []).forEach(fn);
    (data.trash || []).forEach(function (entry) {
      if (entry && entry.kind === 'task' && entry.payload) fn(entry.payload);
    });
  }

  function legacyToV5(data) {
    var monday = D.mondayOf(D.today());
    var sunday = D.addDays(monday, 6);
    function currentCampaignTask(rawTask) {
      var task = cleanTask(rawTask, monday);
      /* V1 has no historical Week entity. Completed work outside this calendar
         week remains in legacyArchive instead of creating fake current XP. */
      if (task.done && (!task.date || task.date < monday || task.date > sunday)) return null;
      if (task.date && (task.date < monday || task.date > sunday)) {
        task.date = null;
        task.time = null;
      }
      return task;
    }
    var objectives = Array.isArray(data.objectives)
      ? data.objectives.map(function (objective) { return cleanLegacyObjective(objective, monday); }) : [];
    var live = objectives.filter(function (objective) { return !objective.archived; });
    var targets = live.map(function (objective) {
      var context = objective.krs.map(function (kr) { return kr.title; }).filter(Boolean);
      var tasks = [];
      objective.krs.forEach(function (kr) {
        kr.tasks.forEach(function (task) {
          var currentTask = currentCampaignTask(task);
          if (currentTask) tasks.push(currentTask);
        });
      });
      return {
        id: objective.id,
        sourceLegacyObjectiveId: objective.id,
        title: objective.title,
        description: context.join(' · '),
        status: 'active',
        tasks: tasks
      };
    });
    var week = {
      id: 'week-' + monday,
      startDate: monday,
      endDate: D.addDays(monday, 6),
      status: 'setup',
      phase: 'greeting',
      startedAt: null,
      completedAt: null,
      sourceWeekId: null,
      importedLegacy: true,
      targets: targets,
      looseTasks: Array.isArray(data.loose)
        ? data.loose.map(currentCampaignTask).filter(Boolean) : [],
      recap: null
    };
    return {
      schemaVersion: SCHEMA,
      profile: { name: 'Derek' },
      progress: { baseXp: 0 },
      weeks: [week],
      routines: Array.isArray(data.routines) ? data.routines.map(cleanRoutine) : [],
      trash: [],
      legacyArchive: {
        migratedAt: now(),
        sourceSchema: Number(data.schemaVersion) || 1,
        objectives: objectives,
        loose: Array.isArray(data.loose)
          ? data.loose.map(function (task) { return cleanTask(task, monday); }) : [],
        trash: Array.isArray(data.trash) ? clone(data.trash) : []
      },
      meta: {
        updatedAt: data.meta && typeof data.meta.updatedAt === 'string' ? data.meta.updatedAt : now(),
        migratedAt: now(),
        migratedFromSchema: Number(data.schemaVersion) || 1
      }
    };
  }

  var STEPS = {
    1: function (data) {
      (data.routines || []).forEach(function (routine) {
        if (Array.isArray(routine.log)) {
          var map = {};
          routine.log.forEach(function (date) { if (typeof date === 'string') map[date] = true; });
          routine.log = map;
        }
      });
      return data;
    },
    2: function (data) {
      var monday = D.mondayOf(D.today());
      eachLegacyTask(data, function (task) {
        if (!D.isIsoDate(task.date) && typeof task.day === 'number' && task.day >= 0 && task.day <= 6) {
          task.date = D.addDays(monday, task.day);
        }
        delete task.type;
        delete task.day;
      });
      return data;
    },
    3: function (data) {
      eachLegacyTask(data, function (task) {
        delete task.loose;
        delete task.source;
        delete task.krTitle;
        delete task.objId;
        delete task.krId;
      });
      return data;
    },
    4: legacyToV5
  };

  function cleanRoot(raw) {
    var data = raw && typeof raw === 'object' ? raw : {};
    var profile = data.profile && typeof data.profile === 'object' ? data.profile : {};
    var progress = data.progress && typeof data.progress === 'object' ? data.progress : {};
    var baseXp = Number(progress.baseXp);
    return {
      schemaVersion: SCHEMA,
      profile: { name: str(profile.name, 'Derek') },
      progress: { baseXp: Number.isFinite(baseXp) && baseXp >= 0 ? Math.round(baseXp) : 0 },
      weeks: Array.isArray(data.weeks) ? data.weeks.map(cleanWeek) : [],
      routines: Array.isArray(data.routines) ? data.routines.map(cleanRoutine) : [],
      trash: cleanTrash(data.trash, D.mondayOf(D.today())),
      legacyArchive: data.legacyArchive && typeof data.legacyArchive === 'object'
        ? clone(data.legacyArchive) : null,
      meta: {
        updatedAt: data.meta && typeof data.meta.updatedAt === 'string' ? data.meta.updatedAt : now(),
        migratedAt: data.meta && typeof data.meta.migratedAt === 'string' ? data.meta.migratedAt : null,
        migratedFromSchema: data.meta && Number.isFinite(Number(data.meta.migratedFromSchema))
          ? Number(data.meta.migratedFromSchema) : null
      }
    };
  }

  function migrate(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('This is not valid Rootwork data.');
    }
    var data = clone(raw);
    var from = Number(data.schemaVersion) || 1;
    if (from > SCHEMA) {
      throw new Error('This data was created by a newer Rootwork version.');
    }
    for (var version = from; version < SCHEMA; version += 1) {
      if (!STEPS[version]) throw new Error('Missing migration step ' + version + '.');
      data = STEPS[version](data);
      data.schemaVersion = version + 1;
    }
    return cleanRoot(data);
  }

  function writable() {
    var key = 'rootwork:test:' + Date.now();
    try {
      global.localStorage.setItem(key, '1');
      global.localStorage.removeItem(key);
      return true;
    } catch (error) {
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
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rootwork-backup-' + D.today() + '.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function importBackup(file, callback) {
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { callback('The file could not be read.'); };
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (error) {
        return callback('The file is not valid JSON.');
      }
      if (!parsed || typeof parsed !== 'object' || parsed.format !== BACKUP_FORMAT) {
        var other = parsed && parsed.format === 'rootflow-backup'
          ? ' This is a Rootflow backup.' : '';
        return callback('This is not a Rootwork backup.' + other);
      }
      if (Number(parsed.schemaVersion) > SCHEMA) {
        return callback('This backup was created by a newer Rootwork version. Update the app first.');
      }
      try {
        return callback(null, migrate(parsed.data));
      } catch (error) {
        return callback(error.message || 'The backup structure is damaged.');
      }
    };
    reader.readAsText(file);
  }

  global.RootworkStore = {
    KEY: KEY,
    SCHEMA: SCHEMA,
    BACKUP_FORMAT: BACKUP_FORMAT,
    TRASH_DAYS: TRASH_DAYS,
    uid: uid,
    now: now,
    empty: empty,
    cleanTask: cleanTask,
    cleanRoutine: cleanRoutine,
    migrate: migrate,
    writable: writable,
    load: load,
    save: save,
    sizeOf: sizeOf,
    nearLimit: nearLimit,
    exportBackup: exportBackup,
    importBackup: importBackup
  };
}(window));
