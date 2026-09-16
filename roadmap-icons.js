/* Roadmap icon correction — replace the flag-like nav glyph with a clean branch/route symbol. */
(function (g) {
  'use strict';
  var U = g.RootworkUI;
  if (!U) return;
  var h = U.h;
  var I = U.I;

  function RoadmapIcon(size) {
    var s = size || 24;
    return h('svg', {
      className: 'roadmap-nav-icon',
      width: s,
      height: s,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': 'true'
    },
      h('circle', { cx: 7, cy: 5, r: 2 }),
      h('circle', { cx: 17, cy: 11, r: 2 }),
      h('circle', { cx: 17, cy: 19, r: 2 }),
      h('path', { d: 'M7 7v8a4 4 0 0 0 4 4h4' }),
      h('path', { d: 'M7 10h6a4 4 0 0 1 4 4v3' })
    );
  }

  U.Nav = function Nav(q) {
    function button(view, icon, label, custom) {
      return h('button', {
        className: q.v === view ? 'active' : '',
        onClick: function () { q.go(view); }
      }, custom ? RoadmapIcon(24) : I(icon, 24, 2), h('span', null, label));
    }
    return h('nav', { className: 'nav nav-v2 roadmap-nav' },
      button('dashboard', 'home', 'Trang chủ'),
      button('goals', 'goal', 'Mục tiêu'),
      button('roadmap', null, 'Roadmap', true),
      button('calendar', 'cal', 'Lịch'),
      button('routines', 'routine', 'Routine'),
      button('progress', 'chart', 'Thống kê')
    );
  };
}(window));
