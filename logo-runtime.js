/* Rootwork logo runtime guard — keeps the real raster mark in the DOM after React renders. */
(function () {
  'use strict';

  var MARK = 'brand/rootwork-sprout-256.png';

  function patchLaunch(lockup) {
    if (!lockup) return;
    var image = lockup.querySelector('.rw-launch-logo');
    if (image) {
      if (image.getAttribute('src') !== MARK) image.setAttribute('src', MARK);
      image.setAttribute('alt', '');
    }

    var word = lockup.querySelector('.rw-launch-word-runtime');
    if (!word) {
      word = document.createElement('strong');
      word.className = 'rw-launch-word-runtime';
      word.textContent = 'Rootwork';
      var tagline = lockup.querySelector('p');
      if (tagline) lockup.insertBefore(word, tagline);
      else lockup.appendChild(word);
    }
  }

  function patch() {
    document.querySelectorAll('.rw-launch-lockup').forEach(patchLaunch);
    document.querySelectorAll('.rw-brand img, .rw-empty-state img').forEach(function (image) {
      if (image.getAttribute('src') !== MARK) image.setAttribute('src', MARK);
    });
  }

  var queued = false;
  function queuePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      patch();
    });
  }

  var observer = new MutationObserver(queuePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();
  window.addEventListener('load', patch);
}());
