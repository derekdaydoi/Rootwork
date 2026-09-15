/* Rootwork Roadmap — preserve optional target timeline metadata without deleting legacy Artifact data. */
(function (global) {
  'use strict';

  var D = global.RootworkDomain;
  var S = global.RootworkStore;
  if (!D || !S) return;

  var baseMigrate = S.migrate;
  var baseEnsureCurrentWeek = D.ensureCurrentWeek;
  var BACKUP_FORMAT = S.BACKUP_FORMAT || 'rootwork-backup';

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function captureRoadmap(raw) {
    var map = {};
    (raw && raw.weeks || []).forEach(function (week) {
      (week && week.targets || []).forEach(function (target) {
        if (!target || typeof target.id !== 'string') return;
        map[week.id + '::' + target.id] = {
          roadmapId: typeof target.roadmapId === 'string' ? target.roadmapId : null,
          roadmapDate: D.isIsoDate(target.roadmapDate) ? target.roadmapDate : null
        };
      });
    });
    return map;
  }

  function reattachRoadmap(cleaned, raw) {
    var map = captureRoadmap(raw);
    (cleaned.weeks || []).forEach(function (week) {
      (week.targets || []).forEach(function (target) {
        var meta = map[week.id + '::' + target.id];
        if (!meta) return;
        target.roadmapId = meta.roadmapId;
        target.roadmapDate = meta.roadmapDate;
      });
    });
    return cleaned;
  }

  function migrate(raw) {
    var source = clone(raw);
    return reattachRoadmap(baseMigrate(raw), source);
  }

  function load() {
    var raw = global.localStorage.getItem(S.KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
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
      if (Number(parsed.schemaVersion) > Number(S.SCHEMA)) {
        return callback('This backup was created by a newer Rootwork version. Update the app first.');
      }
      try { return callback(null, migrate(parsed.data)); }
      catch (error) { return callback(error.message || 'The backup structure is damaged.'); }
    };
    reader.readAsText(file);
  }

  D.ensureCurrentWeek = function (data, at) {
    var next = baseEnsureCurrentWeek(data, at);
    var current = D.currentWeek(next, at || D.today());
    if (!current || !current.sourceWeekId) return next;
    var prior = D.findWeek(next, current.sourceWeekId);
    if (!prior) return next;

    (current.targets || []).forEach(function (target) {
      if (!target.sourceTargetId) return;
      var source = (prior.targets || []).find(function (candidate) {
        return candidate.id === target.sourceTargetId;
      });
      if (!source) return;
      if (typeof source.roadmapId === 'string') target.roadmapId = source.roadmapId;
      if (D.isIsoDate(source.roadmapDate)) target.roadmapDate = source.roadmapDate;
      else if (source.roadmapId) target.roadmapDate = null;
    });
    return next;
  };

  D.roadmapTargets = function (data) {
    var latest = {};
    (data && data.weeks || []).slice().sort(function (a, b) {
      return a.startDate.localeCompare(b.startDate);
    }).forEach(function (week) {
      (week.targets || []).forEach(function (target) {
        if (!target || target.status === 'removed' || typeof target.roadmapId !== 'string') return;
        latest[target.roadmapId] = {
          roadmapId: target.roadmapId,
          roadmapDate: D.isIsoDate(target.roadmapDate) ? target.roadmapDate : null,
          id: target.id,
          title: target.title,
          description: target.description || '',
          weekId: week.id,
          weekStartDate: week.startDate,
          status: week.status,
          progress: D.targetMetrics(target)
        };
      });
    });
    return Object.keys(latest).map(function (key) { return latest[key]; })
      .filter(function (target) { return D.isIsoDate(target.roadmapDate); })
      .sort(function (a, b) {
        if (a.roadmapDate !== b.roadmapDate) return a.roadmapDate.localeCompare(b.roadmapDate);
        return a.title.localeCompare(b.title);
      });
  };

  S.migrate = migrate;
  S.load = load;
  S.importBackup = importBackup;
}(window));
