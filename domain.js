/* Rootwork V2 — pure product rules. No DOM, storage, or React access. */
(function (global) {
  'use strict';

  var DAY = 86400000;
  var DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var XP_RULES = {
    action: 20,
    highAction: 30,
    targetComplete: 40,
    routineCheck: 5,
    routineGoal: 20,
    weekComplete: 50,
    weekStrong: 50
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function pad(value) { return value < 10 ? '0' + value : String(value); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function ymd(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function parseYmd(value) {
    var parts = String(value || '').split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function isIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = parseYmd(value);
    return !Number.isNaN(date.getTime()) && ymd(date) === value;
  }

  function isTime(value) {
    return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function today() { return ymd(new Date()); }

  function addDays(value, amount) {
    var date = parseYmd(value);
    date.setDate(date.getDate() + amount);
    return ymd(date);
  }

  function diffDays(a, b) {
    return Math.round((parseYmd(a).getTime() - parseYmd(b).getTime()) / DAY);
  }

  function mondayOf(value) {
    var date = parseYmd(value || today());
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return ymd(date);
  }

  function weekDates(monday) {
    return DOW.map(function (_, index) { return addDays(monday, index); });
  }

  function isoWeek(value) {
    var date = parseYmd(value);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    var firstThursday = new Date(date.getFullYear(), 0, 4);
    firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
    return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * DAY));
  }

  function fmtDate(value, options) {
    if (!isIsoDate(value)) return 'Unscheduled';
    return parseYmd(value).toLocaleDateString('en-US', options || { month: 'short', day: 'numeric' });
  }

  function fmtDateFull(value) {
    return fmtDate(value, { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function fmtWeekRange(monday) {
    var end = addDays(monday, 6);
    var startDate = parseYmd(monday);
    var endDate = parseYmd(end);
    if (startDate.getMonth() === endDate.getMonth()) {
      return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        '–' + endDate.getDate();
    }
    return fmtDate(monday) + '–' + fmtDate(end);
  }

  function fmtWeekLong(monday) {
    return parseYmd(monday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
      ' – ' + parseYmd(addDays(monday, 6)).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });
  }

  function greeting(date) {
    var hour = (date || new Date()).getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function campaignMessage(monday) {
    var messages = [
      ['New week. New progress.', "Let's make it count."],
      ['A clean week ahead.', 'Choose what deserves momentum.'],
      ['The next campaign starts here.', 'Move what matters.'],
      ['Seven days. A clear direction.', 'Build something real.']
    ];
    var index = Math.abs(diffDays(monday, '2024-01-01')) % messages.length;
    return messages[index];
  }

  function findWeek(data, weekId) {
    return (data.weeks || []).find(function (week) { return week.id === weekId; }) || null;
  }

  function currentWeek(data, at) {
    var monday = mondayOf(at || today());
    return (data.weeks || []).find(function (week) {
      return week.startDate === monday && week.status !== 'complete';
    }) || null;
  }

  function previousWeek(data, week) {
    return (data.weeks || []).filter(function (candidate) {
      return candidate.status === 'complete' && candidate.startDate < week.startDate;
    }).sort(function (a, b) { return b.startDate.localeCompare(a.startDate); })[0] || null;
  }

  function weekTasks(week) {
    var tasks = [];
    (week.targets || []).forEach(function (target) {
      if (target.status === 'removed') return;
      (target.tasks || []).forEach(function (task) {
        tasks.push(Object.assign({}, task, {
          weekId: week.id,
          targetId: target.id,
          targetTitle: target.title,
          loose: false
        }));
      });
    });
    (week.looseTasks || []).forEach(function (task) {
      tasks.push(Object.assign({}, task, {
        weekId: week.id,
        targetId: null,
        targetTitle: 'Loose action',
        loose: true
      }));
    });
    return tasks;
  }

  function bareTask(task) {
    return {
      id: task.id,
      title: task.title,
      note: task.note || '',
      priority: task.priority === 'high' ? 'high' : 'normal',
      done: Boolean(task.done),
      date: isIsoDate(task.date) ? task.date : null,
      time: isTime(task.time) && isIsoDate(task.date) ? task.time : null,
      completedAt: typeof task.completedAt === 'string' ? task.completedAt : null
    };
  }

  function findTarget(data, weekId, targetId) {
    var week = findWeek(data, weekId);
    return week && (week.targets || []).find(function (target) { return target.id === targetId; }) || null;
  }

  function findTask(data, reference) {
    var week = findWeek(data, reference.weekId);
    if (!week) return null;
    if (!reference.targetId) {
      return (week.looseTasks || []).find(function (task) { return task.id === reference.id; }) || null;
    }
    var target = (week.targets || []).find(function (item) { return item.id === reference.targetId; });
    return target && (target.tasks || []).find(function (task) { return task.id === reference.id; }) || null;
  }

  function detachTask(week, reference) {
    if (!reference.targetId) {
      week.looseTasks = (week.looseTasks || []).filter(function (task) { return task.id !== reference.id; });
      return;
    }
    var target = (week.targets || []).find(function (item) { return item.id === reference.targetId; });
    if (target) target.tasks = (target.tasks || []).filter(function (task) { return task.id !== reference.id; });
  }

  function attachTask(week, targetId, task) {
    if (!targetId) {
      week.looseTasks.push(task);
      return;
    }
    var target = (week.targets || []).find(function (item) { return item.id === targetId; });
    if (target) target.tasks.push(task); else week.looseTasks.push(task);
  }

  function sortTasks(list) {
    return list.slice().sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (Boolean(a.time) !== Boolean(b.time)) return a.time ? -1 : 1;
      if (a.time && b.time && a.time !== b.time) return a.time.localeCompare(b.time);
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }

  function donePercent(list) {
    if (!list.length) return 0;
    return Math.round(list.filter(function (task) { return task.done; }).length / list.length * 100);
  }

  function targetMetrics(target) {
    var tasks = target.tasks || [];
    var done = tasks.filter(function (task) { return task.done; }).length;
    return {
      total: tasks.length,
      done: done,
      percent: tasks.length ? Math.round(done / tasks.length * 100) : 0,
      advanced: done > 0,
      stalled: tasks.length > 0 && done === 0,
      complete: tasks.length > 0 && done === tasks.length
    };
  }

  function routineCommitment(routine) {
    var recurrence = routine.recurrence || {};
    if (recurrence.type === 'daily') return 7;
    return clamp(Number(recurrence.target) || 3, 1, 7);
  }

  function routineHits(routine, monday) {
    return weekDates(monday).reduce(function (sum, date) {
      return sum + (routine.log && routine.log[date] ? 1 : 0);
    }, 0);
  }

  function routineWeekStreak(routine, anchorMonday) {
    var monday = anchorMonday || mondayOf(today());
    var target = routineCommitment(routine);
    if (routineHits(routine, monday) < target && monday === mondayOf(today())) {
      monday = addDays(monday, -7);
    }
    var streak = 0;
    var guard = 0;
    while (routineHits(routine, monday) >= target && guard < 520) {
      streak += 1;
      monday = addDays(monday, -7);
      guard += 1;
    }
    return streak;
  }

  function routineSnapshot(routine, monday) {
    var target = routineCommitment(routine);
    var hits = routineHits(routine, monday);
    return {
      id: routine.id,
      name: routine.name,
      target: target,
      hits: hits,
      percent: target ? clamp(Math.round(hits / target * 100), 0, 100) : 0,
      achieved: hits >= target
    };
  }

  function routineConsistency(routines, monday) {
    var target = 0;
    var hits = 0;
    (routines || []).forEach(function (routine) {
      var commitment = routineCommitment(routine);
      target += commitment;
      hits += Math.min(routineHits(routine, monday), commitment);
    });
    return target ? Math.round(hits / target * 100) : 0;
  }

  function weekMetrics(week, routines) {
    var tasks = weekTasks(week);
    var done = tasks.filter(function (task) { return task.done; }).length;
    var targets = (week.targets || []).filter(function (target) { return target.status !== 'removed'; });
    var targetResults = targets.map(targetMetrics);
    var advanced = targetResults.filter(function (result) { return result.advanced; }).length;
    var stalled = targetResults.filter(function (result) { return result.stalled; }).length;
    return {
      total: tasks.length,
      done: done,
      completion: tasks.length ? Math.round(done / tasks.length * 100) : 0,
      targets: targets.length,
      targetsAdvanced: advanced,
      targetsStalled: stalled,
      targetsComplete: targetResults.filter(function (result) { return result.complete; }).length,
      scheduled: tasks.filter(function (task) { return Boolean(task.date); }).length,
      unscheduled: tasks.filter(function (task) { return !task.date && !task.done; }).length,
      routineConsistency: routineConsistency(routines || [], week.startDate)
    };
  }

  function executionXp(week, routines) {
    var xp = weekTasks(week).reduce(function (sum, task) {
      if (!task.done) return sum;
      return sum + (task.priority === 'high' ? XP_RULES.highAction : XP_RULES.action);
    }, 0);
    (week.targets || []).forEach(function (target) {
      if (target.status !== 'removed' && targetMetrics(target).complete) xp += XP_RULES.targetComplete;
    });
    (routines || []).forEach(function (routine) {
      var commitment = routineCommitment(routine);
      var hits = routineHits(routine, week.startDate);
      xp += Math.min(hits, commitment) * XP_RULES.routineCheck;
      if (hits >= commitment) xp += XP_RULES.routineGoal;
    });
    return xp;
  }

  function closeBonus(metrics) {
    if (metrics.total < 3 || metrics.completion < 50) return 0;
    return XP_RULES.weekComplete + (metrics.completion >= 80 ? XP_RULES.weekStrong : 0);
  }

  function buildRecap(week, routines) {
    var metrics = weekMetrics(week, routines || []);
    return {
      completion: metrics.completion,
      xpEarned: executionXp(week, routines || []) + closeBonus(metrics),
      totalActions: metrics.total,
      completedActions: metrics.done,
      targetsAdvanced: metrics.targetsAdvanced,
      targetsStalled: metrics.targetsStalled,
      targetsComplete: metrics.targetsComplete,
      routineConsistency: metrics.routineConsistency,
      routines: (routines || []).map(function (routine) {
        return routineSnapshot(routine, week.startDate);
      })
    };
  }

  function finalizeWeek(week, routines, completedAt) {
    var next = clone(week);
    if (next.status === 'complete' && next.recap) return next;
    next.status = 'complete';
    next.phase = 'complete';
    next.completedAt = completedAt || new Date().toISOString();
    next.recap = buildRecap(next, routines || []);
    return next;
  }

  function createWeek(monday, prior) {
    var weekId = 'week-' + monday;
    var taskIndex = 0;
    var targets = prior ? (prior.targets || []).filter(function (target) {
      return target.status !== 'removed';
    }).map(function (target, targetIndex) {
      return {
        id: weekId + '-target-' + (targetIndex + 1),
        sourceTargetId: target.id,
        title: target.title,
        description: target.description || '',
        status: 'active',
        tasks: (target.tasks || []).filter(function (task) { return !task.done; }).map(function (task) {
          taskIndex += 1;
          return {
            id: weekId + '-task-' + taskIndex,
            sourceTaskId: task.id,
            title: task.title,
            note: task.note || '',
            priority: task.priority === 'high' ? 'high' : 'normal',
            done: false,
            date: null,
            time: null,
            completedAt: null
          };
        })
      };
    }) : [];
    return {
      id: weekId,
      startDate: monday,
      endDate: addDays(monday, 6),
      status: 'setup',
      phase: 'greeting',
      startedAt: null,
      completedAt: null,
      sourceWeekId: prior ? prior.id : null,
      targets: targets,
      looseTasks: [],
      recap: null
    };
  }

  function ensureCurrentWeek(data, at) {
    var monday = mondayOf(at || today());
    var exact = currentWeek(data, at || today());
    if (exact) return data;
    var next = clone(data);
    next.weeks = next.weeks || [];
    next.weeks = next.weeks.map(function (week) {
      if (week.status !== 'complete' && week.startDate < monday) {
        return finalizeWeek(week, next.routines || []);
      }
      return week;
    });
    var existing = next.weeks.find(function (week) { return week.startDate === monday; });
    if (!existing) {
      var prior = next.weeks.filter(function (week) {
        return week.status === 'complete' && week.startDate < monday;
      }).sort(function (a, b) { return b.startDate.localeCompare(a.startDate); })[0] || null;
      next.weeks.push(createWeek(monday, prior));
    }
    return next;
  }

  function weekXp(week, routines) {
    if (week.status === 'complete' && week.recap) return Number(week.recap.xpEarned) || 0;
    return executionXp(week, routines || []);
  }

  function totalXp(data) {
    var total = Number(data.progress && data.progress.baseXp) || 0;
    (data.weeks || []).forEach(function (week) {
      total += weekXp(week, data.routines || []);
    });
    return total;
  }

  function levelFloor(level) {
    var value = Math.max(1, Number(level) || 1);
    return 250 * (value - 1) * value;
  }

  function levelState(xp) {
    var total = Math.max(0, Math.floor(Number(xp) || 0));
    var level = 1;
    while (total >= levelFloor(level + 1) && level < 999) level += 1;
    var floor = levelFloor(level);
    var next = levelFloor(level + 1);
    return {
      level: level,
      totalXp: total,
      currentXp: total - floor,
      neededXp: next - floor,
      percent: Math.round((total - floor) / (next - floor) * 100)
    };
  }

  function attentionItems(week, at) {
    var date = at || today();
    var tasks = weekTasks(week);
    var late = tasks.filter(function (task) { return !task.done && task.date && task.date < date; });
    var stalled = (week.targets || []).filter(function (target) { return targetMetrics(target).stalled; });
    var dueToday = tasks.filter(function (task) { return !task.done && task.date === date; });
    var out = [];
    if (late.length) out.push({ tone: 'danger', label: late.length + ' overdue action' + (late.length === 1 ? '' : 's') });
    if (stalled.length) out.push({ tone: 'warning', label: stalled.length + ' target' + (stalled.length === 1 ? '' : 's') + ' not moving yet' });
    if (dueToday.length) out.push({ tone: 'neutral', label: dueToday.length + ' action' + (dueToday.length === 1 ? '' : 's') + ' planned for today' });
    return out;
  }

  function archiveTrend(data, count) {
    return (data.weeks || []).filter(function (week) { return week.status === 'complete' && week.recap; })
      .sort(function (a, b) { return a.startDate.localeCompare(b.startDate); })
      .slice(-(count || 8)).map(function (week) {
        return {
          week: isoWeek(week.startDate),
          completion: Number(week.recap.completion) || 0,
          xp: Number(week.recap.xpEarned) || 0,
          routines: Number(week.recap.routineConsistency) || 0
        };
      });
  }

  global.RootworkDomain = {
    DAY: DAY,
    DOW: DOW,
    XP_RULES: XP_RULES,
    clone: clone,
    clamp: clamp,
    ymd: ymd,
    parseYmd: parseYmd,
    isIsoDate: isIsoDate,
    isTime: isTime,
    today: today,
    addDays: addDays,
    diffDays: diffDays,
    mondayOf: mondayOf,
    weekDates: weekDates,
    isoWeek: isoWeek,
    fmtDate: fmtDate,
    fmtDateFull: fmtDateFull,
    fmtWeekRange: fmtWeekRange,
    fmtWeekLong: fmtWeekLong,
    greeting: greeting,
    campaignMessage: campaignMessage,
    findWeek: findWeek,
    currentWeek: currentWeek,
    previousWeek: previousWeek,
    weekTasks: weekTasks,
    bareTask: bareTask,
    findTarget: findTarget,
    findTask: findTask,
    detachTask: detachTask,
    attachTask: attachTask,
    sortTasks: sortTasks,
    donePercent: donePercent,
    targetMetrics: targetMetrics,
    routineCommitment: routineCommitment,
    routineHits: routineHits,
    routineWeekStreak: routineWeekStreak,
    routineSnapshot: routineSnapshot,
    routineConsistency: routineConsistency,
    weekMetrics: weekMetrics,
    executionXp: executionXp,
    closeBonus: closeBonus,
    buildRecap: buildRecap,
    finalizeWeek: finalizeWeek,
    createWeek: createWeek,
    ensureCurrentWeek: ensureCurrentWeek,
    weekXp: weekXp,
    totalXp: totalXp,
    levelFloor: levelFloor,
    levelState: levelState,
    attentionItems: attentionItems,
    archiveTrend: archiveTrend
  };
}(window));
