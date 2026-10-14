(function () {
  'use strict';
  var root = document.querySelector('.publications');
  if (!root) return;
  var filters = root.querySelector('.publications__filters');
  var buttons = Array.from(root.querySelectorAll('[data-publication-filter]'));
  var cards = Array.from(root.querySelectorAll('.publication-card'));
  var sections = Array.from(root.querySelectorAll('.publications__section'));
  function matches(card, filter) {
    return filter === 'all' || (filter === 'first' ? card.dataset.firstAuthor === 'true' : card.dataset.publicationStatus === filter);
  }
  function select(filter) {
    cards.forEach(function (card) { card.hidden = !matches(card, filter); });
    sections.forEach(function (section) {
      section.hidden = !Array.from(section.querySelectorAll('.publication-card')).some(function (card) { return !card.hidden; });
    });
    buttons.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.publicationFilter === filter)); });
  }
  buttons.forEach(function (button) {
    var filter = button.dataset.publicationFilter;
    button.querySelector('[data-filter-count]').textContent = '(' + cards.filter(function (card) { return matches(card, filter); }).length + ')';
    button.addEventListener('click', function () { select(filter); });
  });
  filters.hidden = false;
  select('all');
}());
