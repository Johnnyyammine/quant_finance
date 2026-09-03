/* ==========================================================================
   KB UI — chrome shared by every page.
   Command palette, keyboard shortcuts, theme, status controls, toasts.
   Injected at runtime so no page template has to carry the markup.
   ========================================================================== */
(function (global) {
  'use strict';

  var KB = global.KB;
  var doc = global.document;
  var $ = function (sel, root) { return (root || doc).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); };
  var el = function (tag, attrs, html) {
    var n = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* --------------------------------------------------------------- theme -- */

  function applyTheme(t) {
    if (t) doc.documentElement.setAttribute('data-theme', t);
    else doc.documentElement.removeAttribute('data-theme');
  }
  applyTheme(KB.theme.get());

  /* Test for 'dark', not for 'light'. Light is now the stylesheet's base and
     needs no attribute, so on a first visit there is nothing on <html> at all
     -- comparing against 'light' made that read as "not light", and the first
     click set the theme the page was already showing. */
  function toggleTheme() {
    var next = doc.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    KB.theme.set(next);
    applyTheme(next);
  }

  /* --------------------------------------------------------------- toast -- */

  var toastNode = null, toastTimer = null;
  function toast(msg) {
    if (!toastNode) { toastNode = el('div', { class: 'kb-toast' }); doc.body.appendChild(toastNode); }
    toastNode.textContent = msg;
    toastNode.setAttribute('data-show', '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastNode.removeAttribute('data-show'); }, 1800);
  }

  /* ------------------------------------------------------------- overlay -- */

  var overlay = el('div', { class: 'kb-overlay', role: 'dialog', 'aria-modal': 'true' });
  doc.body.appendChild(overlay);
  var overlayCloser = null;

  function openOverlay(node, onClose) {
    overlay.innerHTML = '';
    overlay.appendChild(node);
    overlay.setAttribute('data-open', '');
    overlayCloser = onClose || null;
  }
  function closeOverlay() {
    if (!overlay.hasAttribute('data-open')) return false;
    overlay.removeAttribute('data-open');
    overlay.innerHTML = '';
    if (overlayCloser) { overlayCloser(); overlayCloser = null; }
    return true;
  }
  overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeOverlay(); });

  /* ------------------------------------------------------ command palette -- */

  var SCOPES = [
    { id: '', label: 'Everything' },
    { id: 'concept', label: 'Concepts' },
    { id: 'formula', label: 'Formulas' },
    { id: 'question', label: 'Questions' },
    { id: 'subject', label: 'Subjects' },
  ];
  var KIND_LABEL = { concept: 'concept', formula: 'formula', question: 'question', subject: 'subject' };

  var paletteState = { scope: '', selected: 0, results: [], query: '' };

  function openPalette(initial) {
    var node = el('div', { class: 'kb-palette' });
    node.innerHTML =
      '<input class="kb-palette-input" type="text" placeholder="Search concepts, formulas, interview questions…" ' +
      'autocomplete="off" spellcheck="false" aria-label="Search">' +
      '<div class="kb-palette-scopes">' +
      SCOPES.map(function (s) {
        return '<button class="kb-scope" type="button" data-scope="' + s.id + '" aria-pressed="' +
          (s.id === paletteState.scope) + '">' + s.label + '</button>';
      }).join('') +
      '<span class="kb-palette-hint">↑↓ navigate · ↵ open · esc close</span>' +
      '</div>' +
      '<div class="kb-results" role="listbox"></div>';

    openOverlay(node);
    var input = $('.kb-palette-input', node);
    var results = $('.kb-results', node);

    function render() {
      var q = paletteState.query.trim();
      if (!q) {
        paletteState.results = defaultSuggestions();
        results.innerHTML = '<div class="kb-result-group">Jump to</div>' +
          paletteState.results.map(renderRow).join('');
      } else {
        paletteState.results = KB.search(q, {
          limit: 40,
          types: paletteState.scope ? [paletteState.scope] : null,
        }).map(function (r) { return r.doc; });
        results.innerHTML = paletteState.results.length
          ? paletteState.results.map(renderRow).join('')
          : '<div class="kb-result-empty">No matches for <strong>' + KB.util.escapeHtml(q) +
            '</strong>.<br><span style="font-size:11.5px">Try a tag, a formula name, or part of an interview question.</span></div>';
      }
      paletteState.selected = 0;
      mark();
    }

    function renderRow(doc_) {
      var sub = doc_.t === 'concept' ? (doc_.sum || doc_.ctx) : doc_.ctx;
      // Concept rows carry no meta chip now that the relevance stars are gone.
      var meta = doc_.t === 'question'
        ? '<span class="kb-pill kb-pill--' + doc_.diff + '">' + doc_.diff + '</span>'
        : '';
      return '<a class="kb-result" href="' + KB.base + doc_.path + '" role="option">' +
        '<span class="kb-result-kind">' + (KIND_LABEL[doc_.t] || doc_.t) + '</span>' +
        '<span class="kb-result-main">' +
        '<span class="kb-result-title">' + KB.util.highlight(doc_.title, paletteState.query) + '</span>' +
        '<span class="kb-result-sub">' + KB.util.escapeHtml(sub || '') + '</span></span>' +
        '<span class="kb-result-meta">' + meta + '</span></a>';
    }

    function defaultSuggestions() {
      // With no query, show the highest-value concepts: the thing you most
      // plausibly wanted when you hit "/".
      return KB.concepts.slice()
        .sort(function (a, b) {
          return (b.interviewRelevance - a.interviewRelevance) ||
            a.title.localeCompare(b.title);
        })
        .slice(0, 8)
        .map(function (c) {
          return { t: 'concept', id: c.id, title: c.title, path: c.path, sum: c.summary,
            ctx: (KB.subject(c.subject) || {}).name, rel: c.interviewRelevance };
        });
    }

    function mark() {
      $$('.kb-result', results).forEach(function (n, i) {
        var on = i === paletteState.selected;
        n.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) n.scrollIntoView({ block: 'nearest' });
      });
    }

    input.addEventListener('input', function () { paletteState.query = input.value; render(); });
    input.addEventListener('keydown', function (e) {
      var rows = $$('.kb-result', results);
      if (e.key === 'ArrowDown') { e.preventDefault(); paletteState.selected = Math.min(rows.length - 1, paletteState.selected + 1); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); paletteState.selected = Math.max(0, paletteState.selected - 1); mark(); }
      else if (e.key === 'Enter') {
        var row = rows[paletteState.selected];
        if (row) { e.preventDefault(); global.location.href = row.getAttribute('href'); }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var i = SCOPES.findIndex(function (s) { return s.id === paletteState.scope; });
        paletteState.scope = SCOPES[(i + (e.shiftKey ? SCOPES.length - 1 : 1)) % SCOPES.length].id;
        $$('.kb-scope', node).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-scope') === paletteState.scope));
        });
        render();
      }
    });

    $$('.kb-scope', node).forEach(function (b) {
      b.addEventListener('click', function () {
        paletteState.scope = b.getAttribute('data-scope');
        $$('.kb-scope', node).forEach(function (o) {
          o.setAttribute('aria-pressed', String(o.getAttribute('data-scope') === paletteState.scope));
        });
        render();
        input.focus();
      });
    });

    paletteState.query = initial || '';
    input.value = paletteState.query;
    render();
    input.focus();
  }

  /* ------------------------------------------------------------ shortcuts -- */

  var SHORTCUTS = [
    { group: 'Navigation', keys: [
      ['/', 'Search everything'], ['h', 'Dashboard'], ['g', 'Knowledge graph'],
      ['i', 'Interview mode'], ['l', 'Library'], ['u', 'Up to subject'],
    ] },
    { group: 'Reading', keys: [
      ['←  →', 'Previous / next concept'], ['b', 'Bookmark this concept'],
      ['e', 'Expand all derivations'], ['a', 'Reveal all answers'], ['r', 'Revision card'],
    ] },
    { group: 'General', keys: [
      ['t', 'Toggle light / dark'], ['?', 'This dialog'], ['esc', 'Close'],
      ['j  k', 'Move down / up in lists'],
    ] },
  ];

  function openHelp() {
    var node = el('div', { class: 'kb-dialog' });
    node.innerHTML = '<h2>Keyboard shortcuts</h2>' +
      '<p class="kb-dialog-sub">Built for long study sessions — hands stay on the keyboard.</p>' +
      '<div class="kb-shortcuts">' + SHORTCUTS.map(function (g) {
        return '<dl><dt>' + g.group + '</dt>' + g.keys.map(function (k) {
          return '<dd><span>' + k[1] + '</span>' + k[0].split(/\s+/).map(function (kk) {
            return '<kbd>' + KB.util.escapeHtml(kk) + '</kbd>';
          }).join(' ') + '</dd>';
        }).join('') + '</dl>';
      }).join('') + '</div>';
    openOverlay(node);
  }

  function isTyping(e) {
    var t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (closeOverlay()) e.preventDefault(); return; }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'k') { e.preventDefault(); openPalette(); }
      return;
    }
    if (isTyping(e) || e.altKey) return;

    var go = function (p) { global.location.href = KB.base + p; };
    switch (e.key) {
      case '/': e.preventDefault(); openPalette(); break;
      case '?': e.preventDefault(); openHelp(); break;
      case 'h': go('index.html'); break;
      case 'g': go('graph.html'); break;
      case 'i': go('interview.html'); break;
      case 'l': go('library.html'); break;
      case 't': toggleTheme(); break;
      case 'u': {
        var up = $('.kb-prevnext-up');
        if (up) global.location.href = up.getAttribute('href');
        break;
      }
      case 'ArrowLeft': {
        var prev = $('.kb-prevnext-prev');
        if (prev) global.location.href = prev.getAttribute('href');
        break;
      }
      case 'ArrowRight': {
        var next = $('.kb-prevnext-next');
        if (next) global.location.href = next.getAttribute('href');
        break;
      }
      case 'b': {
        var bm = $('[data-kb-bookmark]');
        if (bm) bm.click();
        break;
      }
      case 'e':
        $$('.kb-derivation').forEach(function (d) { d.open = true; });
        break;
      case 'a':
        $$('.kb-answer, .kb-hint').forEach(function (d) { d.open = true; });
        break;
      default: break;
    }
  });

  /* ------------------------------------------------------- shared wiring -- */

  doc.addEventListener('click', function (e) {
    var openSearch = e.target.closest('[data-kb-open-search]');
    if (openSearch) { e.preventDefault(); openPalette(); return; }
    var themeBtn = e.target.closest('[data-kb-theme]');
    if (themeBtn) { toggleTheme(); return; }
    var helpBtn = e.target.closest('[data-kb-help]');
    if (helpBtn) { openHelp(); return; }

    var copy = e.target.closest('.kb-formula-copy');
    if (copy) {
      var latex = copy.getAttribute('data-latex');
      if (global.navigator.clipboard) {
        global.navigator.clipboard.writeText(latex).then(function () { toast('LaTeX copied'); },
          function () { toast('Copy blocked by the browser'); });
      } else { toast('Clipboard unavailable'); }
      return;
    }

    var bookmark = e.target.closest('[data-kb-bookmark]');
    if (bookmark) {
      var id = bookmark.getAttribute('data-kb-bookmark');
      var on = KB.toggleBookmark(id);
      paintBookmark(bookmark, on);
      toast(on ? 'Bookmarked' : 'Bookmark removed');
      return;
    }

    var missing = e.target.closest('.kb-link--missing');
    if (missing) {
      e.preventDefault();
      var wanted = missing.getAttribute('data-missing');
      toast('No concept "' + wanted + '" yet — npm run new -- "…" --id ' + wanted);
    }
  });

  function paintBookmark(node, on) {
    node.setAttribute('aria-pressed', String(on));
    node.textContent = (on ? '★' : '☆') + ' Bookmark';
  }
  $$('[data-kb-bookmark]').forEach(function (n) {
    paintBookmark(n, KB.isBookmarked(n.getAttribute('data-kb-bookmark')));
  });

  // Mark the active top-level section.
  var page = doc.documentElement.getAttribute('data-page');
  var navFor = { home: 'home', concept: null, subject: null, graph: 'graph', interview: 'interview', library: 'library' };
  var activeNav = navFor[page];
  if (activeNav) {
    var link = $('.kb-toplinks [data-nav="' + activeNav + '"]');
    if (link) link.setAttribute('aria-current', 'page');
  }

  global.KBUI = {
    openPalette: openPalette,
    openHelp: openHelp,
    openOverlay: openOverlay,
    closeOverlay: closeOverlay,
    toast: toast,
    el: el, $: $, $$: $$,
  };
})(window);
