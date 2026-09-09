/* Rootwork mobile interaction guard — prevent accidental page/panel pinch zoom in standalone PWA. */
(function (global) {
  'use strict';

  function preventGesture(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
  }

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });
  document.addEventListener('touchmove', function (event) {
    if (event.touches && event.touches.length > 1) preventGesture(event);
  }, { passive: false });
}(window));
