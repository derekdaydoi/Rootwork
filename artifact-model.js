/* Rootwork Artifact V1 — interval-native artifact model + schema 6 compatibility. */
(function (global) {
  'use strict';

  var D = global.RootworkDomain;
  var S = global.RootworkStore;
  if (!D || !S) return;

  var BASE_SCHEMA = Number(S.SCHEMA) || 5;
  var SCHEMA = 6;
  var baseMigrate = S.migrate;
  var baseEmpty = S.empty;
  var baseExportBackup = S.exportBackup;
  var BACKUP_FORMAT = S.BACKUP_FORMAT || 'rootwork-backup';

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function str(value, fallback) {
    var text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
  }
  function isoOr(value, fallback) { return D.isIsoDate(value) ? value : fallback; }
  function now() { return S.now ? S.now() : new Date().toISOString(); }

  function cleanArtifact(raw) {
    var item = raw && typeof raw === 'object' ? raw : {};
    var start = isoOr(item.startDate, D.today());
    var end = isoOr(item.endDate, start);
    if (end < start) end = start;
    var state = ['open', 'paused', 'completed', 'cancelled'].indexOf(item.state) >= 0
      ? item.state : 'open';
    return {
      id: str(item.id, S.uid()),
      title: str(item.title, 'Untitled artifact'),
      description: typeof item.description === 'string' ? item.description : '',
      note: typeof item.note === 'string' ? item.note : '',
      startDate: start,
      endDate: end,
      state: state,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : now(),
      completedAt: state === 'completed' && typeof item.completedAt === 'string' ? item.completedAt : null,
      cancelledAt: state === 'cancelled' && typeof item.cancelledAt === 'string' ? item.cancelledAt : null
    };
  }

  function findRawWeek(raw, id) {
    return (raw.weeks || []).find(function (week) { return week && week.id === id; }) || null;
  }

  function reattachTaskArtifactIds(cleaned, raw) {
    var artifactIds = new Set((cleaned.artifacts || []).map(function (a) { return a.id; }));
    (cleaned.weeks || []).forEach(function (week) {
      var sourceWeek = findRawWeek(raw, week.id);
      if (!sourceWeek) return;
      (week.targets || []).forEach(function (target) {
        var sourceTarget = (sourceWeek.targets || []).find(function (x) { return x && x.id === target.id; });
        if (!sourceTarget) return;
        (target.tasks || []).forEach(function (task) {
          var sourceTask = (sourceTarget.tasks || []).find(function (x) { return x && x.id === task.id; });
          task.artifactId = sourceTask && artifactIds.has(sourceTask.artifactId) ? sourceTask.artifactId : null;
        });
      });
      (week.looseTasks || []).forEach(function (task) {
        var sourceTask = (sourceWeek.looseTasks || []).find(function (x) { return x && x.id === task.id; });
        task.artifactId = sourceTask && artifactIds.has(sourceTask.artifactId) ? sourceTask.artifactId : null;
      });
    });

    var rawTrash = Array.isArray(raw.trash) ? raw.trash : [];
    (cleaned.trash || []).forEach(function (entry) {
      if (entry.kind !== 'task' || !entry.payload) return;
      var source = rawTrash.find(function (x) { return x && x.id === entry.id; });
      if (source && source.kind === 'task' && source.payload && artifactIds.has(source.payload.artifactId)) {
        entry.payload.artifactId = source.payload.artifactId;
      } else {
        entry.payload.artifactId = null;
      }
    });
  }

  function cleanArtifactTrash(rawTrash) {
    var cutoff = Date.now() - (Number(S.TRASH_DAYS) || 30) * D.DAY;
    if (!Array.isArray(rawTrash)) return [];
    return rawTrash.filter(function (entry) {
      return entry && entry.kind === 'artifact' && entry.payload &&
        Number.isFinite(Date.parse(entry.deletedAt)) && Date.parse(entry.deletedAt) > cutoff;
    }).map(function (entry) {
      return {
        id: str(entry.id, S.uid()),
        deletedAt: entry.deletedAt,
        kind: 'artifact',
        label: str(entry.label, 'Deleted artifact'),
        weekId: null,
        targetId: null,
        payload: cleanArtifact(entry.payload)
      };
    });
  }

  function migrate(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('This is not valid Rootwork data.');
    }
    var from = Number(raw.schemaVersion) || 1;
    if (from > SCHEMA) throw new Error('This data was created by a newer Rootwork version.');

    var source = clone(raw);
    var downgraded = clone(raw);
    downgraded.schemaVersion = Math.min(from, BASE_SCHEMA);
    /* Schema-5 cleaner does not know Artifact trash. Keep it aside to avoid coercion to task. */
    downgraded.trash = (downgraded.trash || []).filter(function (entry) {
      return !entry || entry.kind !== 'artifact';
    });

    var cleaned = baseMigrate(downgraded);
    cleaned.schemaVersion = SCHEMA;
    cleaned.artifacts = Array.isArray(source.artifacts) ? source.artifacts.map(cleanArtifact) : [];
    cleaned.trash = (cleaned.trash || []).concat(cleanArtifactTrash(source.trash));
    reattachTaskArtifactIds(cleaned, source);
    return cleaned;
  }

  function empty() {
    var data = baseEmpty();
    data.schemaVersion = SCHEMA;
    data.artifacts = [];
    return data;
  }

  function load() {
    var raw = global.localStorage.getItem(S.KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  }

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
      try { parsed = JSON.parse(String(reader.result)); }
      catch (error) { return callback('The file is not valid JSON.'); }
      if (!parsed || typeof parsed !== 'object' || parsed.format !== BACKUP_FORMAT) {
        var other = parsed && parsed.format === 'rootflow-backup' ? ' This is a Rootflow backup.' : '';
        return callback('This is not a Rootwork backup.' + other);
      }
      if (Number(parsed.schemaVersion) > SCHEMA) {
        return callback('This backup was created by a newer Rootwork version. Update the app first.');
      }
      try { return callback(null, migrate(parsed.data)); }
      catch (error) { return callback(error.message || 'The backup structure is damaged.'); }
    };
    reader.readAsText(file);
  }

  function artifactPhase(artifact, at) {
    if (!artifact) return 'unknown';
    if (artifact.state === 'completed') return 'completed';
    if (artifact.state === 'cancelled') return 'cancelled';
    if (artifact.state === 'paused') return 'paused';
    var date = at || D.today();
    if (date < artifact.startDate) return 'upcoming';
    if (date > artifact.endDate) return 'overdue';
    return 'active';
  }

  function artifactOverlapsRange(artifact, start, end) {
    return Boolean(artifact && D.isIsoDate(start) && D.isIsoDate(end) &&
      artifact.startDate <= end && artifact.endDate >= start);
  }

  function artifactContainsDate(artifact, date) {
    return Boolean(artifact && D.isIsoDate(date) && artifact.startDate <= date && artifact.endDate >= date);
  }

  function artifactTasks(data, artifactId) {
    var out = [];
    (data.weeks || []).forEach(function (week) {
      D.weekTasks(week).forEach(function (task) {
        if (task.artifactId === artifactId) out.push(task);
      });
    });
    return out;
  }

  function artifactTaskProgress(data, artifactId) {
    var list = artifactTasks(data, artifactId);
    var done = list.filter(function (task) { return task.done; }).length;
    return { total: list.length, done: done, percent: list.length ? Math.round(done / list.length * 100) : 0 };
  }

  function artifactTimeProgress(artifact, at) {
    if (!artifact) return 0;
    var total = Math.max(1, D.diffDays(artifact.endDate, artifact.startDate) + 1);
    var elapsed = D.diffDays(at || D.today(), artifact.startDate) + 1;
    return D.clamp(Math.round(elapsed / total * 100), 0, 100);
  }

  function findArtifact(data, id) {
    return (data.artifacts || []).find(function (artifact) { return artifact.id === id; }) || null;
  }

  /* Carry artifact identity through the existing weekly rollover. */
  var baseEnsureCurrentWeek = D.ensureCurrentWeek;
  D.ensureCurrentWeek = function (data, at) {
    var next = baseEnsureCurrentWeek(data, at);
    var current = D.currentWeek(next, at || D.today());
    if (!current || !current.sourceWeekId) return next;
    var prior = D.findWeek(next, current.sourceWeekId);
    if (!prior) return next;
    var priorTasks = D.weekTasks(prior);
    (current.targets || []).forEach(function (target) {
      (target.tasks || []).forEach(function (task) {
        if (task.artifactId || !task.sourceTaskId) return;
        var source = priorTasks.find(function (x) { return x.id === task.sourceTaskId; });
        task.artifactId = source && source.artifactId ? source.artifactId : null;
      });
    });
    return next;
  };

  D.artifactPhase = artifactPhase;
  D.artifactOverlapsRange = artifactOverlapsRange;
  D.artifactContainsDate = artifactContainsDate;
  D.artifactTasks = artifactTasks;
  D.artifactTaskProgress = artifactTaskProgress;
  D.artifactTimeProgress = artifactTimeProgress;
  D.findArtifact = findArtifact;

  S.SCHEMA = SCHEMA;
  S.cleanArtifact = cleanArtifact;
  S.migrate = migrate;
  S.empty = empty;
  S.load = load;
  S.exportBackup = exportBackup;
  S.importBackup = importBackup;
  S._artifactBaseExportBackup = baseExportBackup;
}(window));
