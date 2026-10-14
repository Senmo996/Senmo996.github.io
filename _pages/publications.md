---
layout: archive
title: "Publications"
permalink: /publications/
author_profile: true
publication_cards: true
---

<div class="publications" id="publications">
<p class="publications__intro">Published papers and preprints. {% if site.author.googlescholar %}<a href="{{ site.author.googlescholar }}">Google Scholar ↗</a>{% endif %}</p>
<div class="publications__filters" role="group" aria-label="Filter publications" hidden>
  <button type="button" data-publication-filter="all" aria-pressed="true">All <span data-filter-count="all"></span></button>
  <button type="button" data-publication-filter="published" aria-pressed="false">Published <span data-filter-count="published"></span></button>
  <button type="button" data-publication-filter="preprint" aria-pressed="false">Preprints <span data-filter-count="preprint"></span></button>
  <button type="button" data-publication-filter="first" aria-pressed="false">First Author <span data-filter-count="first"></span></button>
</div>
<p class="publications__result" role="status" aria-live="polite" aria-atomic="true"></p>
{% assign publications = site.publications | sort: 'date' | reverse %}
<section class="publications__section" aria-labelledby="published-papers">
<h2 class="publications__heading" id="published-papers">Published Papers</h2>
{% for post in publications %}
  {% unless post.status == 'preprint' %}
    {% include publication-card.html %}
  {% endunless %}
{% endfor %}
</section>
<section class="publications__section" aria-labelledby="preprints">
<h2 class="publications__heading" id="preprints">Preprints</h2>
{% for post in publications %}
  {% if post.status == 'preprint' %}
    {% include publication-card.html %}
  {% endif %}
{% endfor %}
</section>
</div>
