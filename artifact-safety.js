/* Artifact safety adapters for historical read-only work. */
(function (g) {
  'use strict';
  var D = g.RootworkDomain;
  var U = g.RootworkUI;
  if (D && D.artifactTasks) {
    var baseArtifactTasks = D.artifactTasks;
    D.artifactTasks = function (data, artifactId) {
      return baseArtifactTasks(data, artifactId).map(function (task) {
        var week = D.findWeek(data, task.weekId);
        return Object.assign({}, task, { readonly: Boolean(week && week.status === 'complete') });
      });
    };
  }
  if (U && U.Task) {
    var BaseTask = U.Task;
    U.Task = function (q) {
      if (!q || !q.x || !q.x.readonly) return BaseTask(q);
      var safe = Object.assign({}, q, { toggle: function () {}, edit: null });
      return BaseTask(safe);
    };
  }
}(window));
