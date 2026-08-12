/* Rootwork contextual UI helpers — presentation interaction only.
   Core data mutations remain owned by app.js/domain.js/store.js. */
(function () {
  'use strict';

  function activeLabel() {
    var on = document.querySelector('.bottom-nav-item.on span');
    return on ? on.textContent.trim() : '';
  }

  function headerAddButton() {
    return document.querySelector('.screen-actions .icon-btn.soft');
  }

  function syncFab() {
    var fab = document.querySelector('.fab');
    if (!fab) return;

    var label = activeLabel();
    var title = 'Thêm việc';
    var context = 'task';

    if (!document.querySelector('.bottom-nav')) {
      context = 'hidden';
      title = '';
    } else if (label === 'Mục tiêu') {
      context = 'objective';
      title = 'Objective mới';
    } else if (label === 'Thói quen') {
      context = 'routine';
      title = 'Thói quen mới';
    } else if (label === 'Hôm nay' || label === 'Cả tuần') {
      context = 'task';
      title = 'Thêm việc';
    } else if (label === 'Tổng quan') {
      context = 'task';
      title = 'Thêm việc';
    }

    fab.dataset.context = context;
    if (title) {
      fab.setAttribute('title', title);
      fab.setAttribute('aria-label', title);
    }
  }

  /* Week cards only need the weekday. The underlying date is preserved in React
     state/data and still drives task assignment; this changes presentation only. */
  function syncWeekdayLabels() {
    var labels = {
      T2: 'Thứ 2',
      T3: 'Thứ 3',
      T4: 'Thứ 4',
      T5: 'Thứ 5',
      T6: 'Thứ 6',
      T7: 'Thứ 7',
      CN: 'Chủ nhật'
    };

    document.querySelectorAll('.week-day-top strong').forEach(function (node) {
      var text = node.textContent.trim();
      var code = text.split(/\s+/)[0];
      if (labels[code] && text !== labels[code]) node.textContent = labels[code];
    });
  }

  function syncUi() {
    syncFab();
    syncWeekdayLabels();
  }

  /* On non-home pages, proxy the floating + to that page's own + action.
     Home deliberately falls through to the original React handler = new task. */
  document.addEventListener('click', function (event) {
    var fab = event.target.closest && event.target.closest('.fab');
    if (!fab) return;

    var label = activeLabel();
    if (!label || label === 'Tổng quan') return;

    var pageAdd = headerAddButton();
    if (!pageAdd) return;

    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();

    window.setTimeout(function () { pageAdd.click(); }, 0);
  }, true);

  var observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncUi);
  } else {
    syncUi();
  }
}());
