(function () {
  'use strict';
  // Handle same-page links before the theme's generic smooth-scroll plugin.
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    history.pushState(null, '', url.hash);
    target.scrollIntoView({ behavior: 'auto', block: 'start' });
    var mobileMenu = document.querySelector('#site-nav .hidden-links');
    if (mobileMenu) mobileMenu.classList.add('hidden');
    var menuButton = document.querySelector('#site-nav > button');
    if (menuButton) menuButton.classList.remove('close');
  }, true);
}());
