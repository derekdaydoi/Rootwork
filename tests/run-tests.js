'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const storage = new Map();
const context = {
  console,
  Date,
  Math,
  JSON,
  Number,
  String,
  Array,
  Object,
  Boolean,
  Blob,
  URL,
  setTimeout,
  clearTimeout,
  crypto: { randomUUID: () => 'test-' + Math.random().toString(36).slice(2) },
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'domain.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'store.js'), 'utf8'), context);

const D = context.RootworkDomain;
const S = context.RootworkStore;
let passed = 0;

function test(name, run) {
  run();
  passed += 1;
  process.stdout.write('✓ ' + name + '\n');
}

function task(id, title, done, priority, date) {
  return {
    id,
    title,
    note: '',
    priority: priority || 'normal',
    done: Boolean(done),
    date: date || null,
    time: null,
    completedAt: done ? '2026-08-24T08:00:00.000Z' : null
  };
}

test('date helpers use valid local calendar dates and Monday weeks', () => {
  assert.equal(D.isIsoDate('2026-02-29'), false);
  assert.equal(D.isIsoDate('2024-02-29'), true);
  assert.equal(D.mondayOf('2026-08-27'), '2026-08-24');
  assert.deepEqual(Array.from(D.weekDates('2026-08-24')), [
    '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27',
    '2026-08-28', '2026-08-29', '2026-08-30'
  ]);
});

test('weekly completion includes scheduled and unscheduled actions', () => {
  const week = D.createWeek('2026-08-24', null);
  week.targets.push({
    id: 'target-1',
    title: 'Ship V1',
    description: '',
    status: 'active',
    tasks: [task('a', 'Build', true), task('b', 'Test', false, 'normal', '2026-08-26')]
  });
  week.looseTasks.push(task('c', 'Unexpected fix', true));
  const metrics = D.weekMetrics(week, []);
  assert.equal(metrics.total, 3);
  assert.equal(metrics.done, 2);
  assert.equal(metrics.completion, 67);
  assert.equal(metrics.unscheduled, 0);
});

test('XP is centralized, capped for routines, and close bonuses require execution', () => {
  const week = D.createWeek('2026-08-24', null);
  week.targets.push({
    id: 'target-1',
    title: 'Ship V1',
    description: '',
    status: 'active',
    tasks: [task('a', 'Build', true), task('b', 'Test', true, 'high')]
  });
  week.looseTasks.push(task('c', 'Document', false));
  const routine = {
    id: 'r1',
    name: 'Read',
    recurrence: { type: 'weekly', target: 3 },
    log: {
      '2026-08-24': true,
      '2026-08-25': true,
      '2026-08-26': true,
      '2026-08-27': true
    }
  };
  assert.equal(D.executionXp(week, [routine]), 125);
  const recap = D.buildRecap(week, [routine]);
  assert.equal(recap.completion, 67);
  assert.equal(recap.xpEarned, 175);
});

test('level thresholds increase by 500 XP per current level', () => {
  assert.equal(D.levelState(0).level, 1);
  assert.equal(D.levelState(499).level, 1);
  assert.equal(D.levelState(500).level, 2);
  assert.equal(D.levelState(1499).level, 2);
  assert.equal(D.levelState(1500).level, 3);
});

test('rollover freezes the old week and carries only incomplete work without schedule', () => {
  const previous = D.createWeek('2026-08-17', null);
  previous.status = 'active';
  previous.phase = 'active';
  previous.targets.push({
    id: 'target-1',
    title: 'Health',
    description: 'Run 20 km',
    status: 'active',
    tasks: [
      task('done', 'Run 5 km', true, 'normal', '2026-08-18'),
      task('open', 'Long run', false, 'high', '2026-08-23')
    ]
  });
  const data = {
    schemaVersion: 5,
    profile: { name: 'Derek' },
    progress: { baseXp: 0 },
    weeks: [previous],
    routines: [],
    trash: [],
    legacyArchive: null,
    meta: {}
  };
  const rolled = D.ensureCurrentWeek(data, '2026-08-24');
  const oldWeek = rolled.weeks.find((week) => week.startDate === '2026-08-17');
  const current = D.currentWeek(rolled, '2026-08-24');
  assert.equal(oldWeek.status, 'complete');
  assert.ok(oldWeek.recap);
  assert.equal(current.phase, 'greeting');
  assert.equal(current.targets[0].tasks.length, 1);
  assert.equal(current.targets[0].tasks[0].title, 'Long run');
  assert.equal(current.targets[0].tasks[0].date, null);
  assert.equal(current.targets[0].tasks[0].time, null);
  assert.equal(previous.status, 'active');
});

test('v4 migration flattens active KRs and preserves the original hierarchy', () => {
  const legacy = {
    schemaVersion: 4,
    objectives: [
      {
        id: 'o1',
        title: 'Health',
        deadline: null,
        archived: false,
        krs: [
          {
            id: 'kr1',
            title: 'Run 20 km',
            metric: { current: 5, target: 20, unit: 'km' },
            tasks: [
              { id: 'open', title: 'Long run', note: '', priority: 'high', done: false, date: '2026-08-10', time: '07:00' },
              { id: 'old-done', title: 'Old run', note: '', priority: 'low', done: true, date: '2026-08-10', time: null }
            ]
          }
        ]
      },
      {
        id: 'o2',
        title: 'Archived objective',
        deadline: null,
        archived: true,
        krs: []
      }
    ],
    loose: [],
    routines: [{ id: 'r1', name: 'Read', target: 3, log: { '2026-08-24': true } }],
    trash: [],
    meta: { updatedAt: '2026-08-24T00:00:00.000Z' }
  };
  const migrated = S.migrate(legacy);
  const current = D.currentWeek(migrated, D.today());
  assert.equal(migrated.schemaVersion, 5);
  assert.equal(current.targets.length, 1);
  assert.equal(current.targets[0].title, 'Health');
  assert.equal(current.targets[0].description, 'Run 20 km');
  assert.equal(current.targets[0].tasks.length, 1);
  assert.equal(current.targets[0].tasks[0].date, null);
  assert.equal(current.targets[0].tasks[0].time, null);
  assert.equal(migrated.legacyArchive.objectives.length, 2);
  assert.equal(migrated.legacyArchive.objectives[0].krs[0].metric.unit, 'km');
  assert.equal(migrated.routines[0].recurrence.target, 3);
  assert.equal(migrated.routines[0].log['2026-08-24'], true);
});

test('newer schemas are rejected before cleanup or save', () => {
  assert.throws(() => S.migrate({ schemaVersion: 99, weeks: [] }), /newer Rootwork version/);
  storage.set(S.KEY, JSON.stringify({ schemaVersion: 99, weeks: [], sentinel: 'keep' }));
  assert.throws(() => S.load(), /newer Rootwork version/);
  assert.equal(JSON.parse(storage.get(S.KEY)).sentinel, 'keep');
});

test('clean task enforces time requires a valid date', () => {
  const cleaned = S.cleanTask({ id: 't', title: 'Test', date: null, time: '09:30' }, '2026-08-24');
  assert.equal(cleaned.time, null);
});

test('language preference persists independently from weekly data', () => {
  const weeklyData = storage.get(S.KEY);
  assert.equal(S.getLocale(), 'en');
  S.setLocale('vi');
  assert.equal(S.getLocale(), 'vi');
  assert.equal(storage.get(S.KEY), weeklyData);
  S.setLocale('unsupported');
  assert.equal(S.getLocale(), 'en');
});

process.stdout.write('\n' + passed + ' tests passed.\n');
