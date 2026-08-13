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
    }

    fab.dataset.context = context;
    if (title) {
      fab.setAttribute('title', title);
      fab.setAttribute('aria-label', title);
    }
  }

  function syncWeekdayLabels() {
    var labels = { T2: 'Thứ 2', T3: 'Thứ 3', T4: 'Thứ 4', T5: 'Thứ 5', T6: 'Thứ 6', T7: 'Thứ 7', CN: 'Chủ nhật' };
    document.querySelectorAll('.week-day-top strong').forEach(function (node) {
      var text = node.textContent.trim();
      var code = text.split(/\s+/)[0];
      if (labels[code] && text !== labels[code]) node.textContent = labels[code];
    });
  }

  function syncHabitControls() {
    var dayButtons = Array.prototype.slice.call(document.querySelectorAll('.day-strip.compact .day-pick'));
    var shortDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    document.querySelectorAll('.routine.modern').forEach(function (card) {
      var dots = Array.prototype.slice.call(card.querySelectorAll('.routine-dot'));
      dots.forEach(function (dot, index) {
        var dayButton = dayButtons[index];
        var blocked = !dayButton || dayButton.disabled;
        dot.classList.toggle('habit-retro-dot', !blocked);
        dot.classList.toggle('habit-retro-dot-disabled', blocked);
        dot.setAttribute('data-day', shortDays[index] || '');
        dot.setAttribute('aria-label', (dot.classList.contains('on') ? 'Bỏ ghi nhận ' : 'Ghi nhận ') + (dayButton ? dayButton.textContent.trim() : shortDays[index]));
        if (!blocked) {
          dot.setAttribute('role', 'button');
          dot.setAttribute('tabindex', '0');
          dot.setAttribute('title', 'Chạm để ghi nhận ngày này');
          dot.removeAttribute('aria-disabled');
        } else {
          dot.removeAttribute('role');
          dot.removeAttribute('tabindex');
          dot.setAttribute('aria-disabled', 'true');
        }
      });

      var input = card.querySelector('input.target-box');
      if (!input) return;

      var picker = card.querySelector('select.target-wheel');
      if (!picker) {
        input.classList.add('target-box-source');
        picker = document.createElement('select');
        picker.className = 'target-wheel';
        picker.setAttribute('aria-label', 'Số lần mỗi tuần');
        for (var n = 1; n <= 7; n += 1) {
          var option = document.createElement('option');
          option.value = String(n);
          option.textContent = String(n);
          picker.appendChild(option);
        }
        input.insertAdjacentElement('afterend', picker);
      }
      picker.value = String(input.value || '1');
    });
  }

  function syncUi() {
    syncFab();
    syncWeekdayLabels();
    syncHabitControls();
  }

  document.addEventListener('click', function (event) {
    var fab = event.target.closest && event.target.closest('.fab');
    if (fab) {
      var label = activeLabel();
      if (label && label !== 'Tổng quan') {
        var pageAdd = headerAddButton();
        if (pageAdd) {
          event.preventDefault();
          event.stopPropagation();
          if (event.stopImmediatePropagation) event.stopImmediatePropagation();
          window.setTimeout(function () { pageAdd.click(); }, 0);
          return;
        }
      }
    }

    var dot = event.target.closest && event.target.closest('.routine-dot.habit-retro-dot');
    if (!dot) return;

    var card = dot.closest('.routine.modern');
    if (!card) return;
    var cards = Array.prototype.slice.call(document.querySelectorAll('.routine.modern'));
    var cardIndex = cards.indexOf(card);
    var dots = Array.prototype.slice.call(card.querySelectorAll('.routine-dot'));
    var dayIndex = dots.indexOf(dot);
    var dayButtons = Array.prototype.slice.call(document.querySelectorAll('.day-strip.compact .day-pick'));
    var dayButton = dayButtons[dayIndex];
    if (dayIndex < 0 || !dayButton || dayButton.disabled) return;

    event.preventDefault();
    event.stopPropagation();

    var alreadyPicked = dayButton.classList.contains('on');
    if (!alreadyPicked) dayButton.click();

    window.setTimeout(function () {
      var liveCards = document.querySelectorAll('.routine.modern');
      var liveCard = liveCards[cardIndex];
      var toggle = liveCard && liveCard.querySelector('.routine-toggle');
      if (toggle && !toggle.disabled) toggle.click();
    }, alreadyPicked ? 0 : 30);
  }, true);

  document.addEventListener('keydown', function (event) {
    var dot = event.target.closest && event.target.closest('.routine-dot.habit-retro-dot');
    if (!dot || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    dot.click();
  });

  document.addEventListener('change', function (event) {
    var picker = event.target.closest && event.target.closest('select.target-wheel');
    if (!picker) return;
    var card = picker.closest('.routine.modern');
    var input = card && card.querySelector('input.target-box');
    if (!input) return;

    var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, picker.value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  var observer = new MutationObserver(syncUi);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncUi);
  else syncUi();
}());