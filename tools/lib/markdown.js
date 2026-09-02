'use strict';
/**
 * Markdown renderer tuned for quant-finance concept pages.
 *
 * Beyond CommonMark basics it understands three things the knowledge base
 * depends on:
 *   - LaTeX ($...$, $$...$$) is extracted before parsing so that _ and *
 *     inside formulas are never mistaken for emphasis, then restored verbatim
 *     for KaTeX auto-render to pick up in the browser.
 *   - [[concept-id]] / [[concept-id|label]] wiki links, resolved against the
 *     concept registry so the knowledge graph can be derived from prose.
 *   - ::: directives (formula boxes, derivations, callouts, interactive module
 *     mounts), which are what makes a concept page more than an essay.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
const attr = (s) => escapeHtml(s);
const slug = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

/**
 * @param {string} src markdown body
 * @param {object} ctx { resolveLink(id) -> {href,title,missing} }
 */
function render(src, ctx = {}) {
  const state = {
    ctx,
    math: [],
    code: [],
    formulas: [],
    modules: [],
    links: [],
    headings: [],
    warnings: [],
  };
  let text = String(src).replace(/\r\n/g, '\n');
  text = protectMath(text, state);
  const html = blocks(splitLines(text), state);
  return {
    html: restore(html, state),
    formulas: state.formulas,
    modules: state.modules,
    links: state.links,
    headings: state.headings,
    warnings: state.warnings,
  };
}

/* ---------------------------------------------------------------- math ---- */

function protectMath(text, state) {
  const stash = (raw, display) => {
    state.math.push({ raw, display });
    return ' \u0000M' + (state.math.length - 1) + '\u0000 ';
  };
  const stashCode = (m) => {
    state.code.push(m);
    return ' \u0000C' + (state.code.length - 1) + '\u0000 ';
  };
  return text
    // Code is protected first so $ inside it stays literal -- and so that an
    // "<!--" in a code sample is not read as an authoring note below. An
    // unpaired one used to delete everything up to the next "-->".
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, stashCode)
    .replace(/`[^`\n]*`/g, stashCode)
    // Authoring notes never reach the page. Stripped before links and maths so
    // a commented-out [[link]] or $formula$ is not parsed either.
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => stash(m, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => stash(m, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => stash(m, false))
    // Single $...$. Ignores $5bn (needs a non-word char before the opening $
    // and no space after it) and escaped \$.
    //
    // The body may wrap across a line -- prose is hard-wrapped at 100 columns,
    // so an inline formula near the margin routinely straddles a newline, and
    // forbidding that silently leaked the raw LaTeX onto the page. A blank
    // line still ends it: two unmatched $ in one paragraph should not swallow
    // everything between them.
    // `\$` inside the body is a literal dollar sign in LaTeX ("\$109.4"), so it
    // must be consumed as a pair -- otherwise it is mistaken for the closing
    // delimiter and the rest of the formula spills onto the page as source.
    .replace(/(^|[^\\$\w])\$(?!\s)((?:\\\$|[^$\n]|\n(?!\s*\n))+?)(?<!\s)\$(?![\w$])/g,
      (_, pre, m) => pre + stash(m, false));
}

const PLACEHOLDER = /\u0000([MC])(\d+)\u0000/g;

function restore(html, state) {
  let out = html;
  for (let pass = 0; pass < 5 && PLACEHOLDER.test(out); pass += 1) {
    PLACEHOLDER.lastIndex = 0;
    out = out.replace(PLACEHOLDER, (_, kind, i) => {
      if (kind === 'M') {
        const { raw, display } = state.math[Number(i)];
        const body = escapeHtml(raw.trim());
        return display
          ? '<span class="math-display">\\[' + body + '\\]</span>'
          : '<span class="math-inline">\\(' + body + '\\)</span>';
      }
      return renderCode(state.code[Number(i)]);
    });
    PLACEHOLDER.lastIndex = 0;
  }
  return out;
}

function renderCode(raw) {
  const fence = raw.match(/^(?:```|~~~)([^\n]*)\n([\s\S]*?)(?:```|~~~)\s*$/);
  if (fence) {
    const lang = fence[1].trim().split(/\s+/)[0] || '';
    return '<figure class="kb-code"' + (lang ? ' data-lang="' + attr(lang) + '"' : '') +
      '><pre><code' + (lang ? ' class="language-' + attr(lang) + '"' : '') + '>' +
      escapeHtml(fence[2].replace(/\n$/, '')) + '</code></pre></figure>';
  }
  return '<code>' + escapeHtml(raw.replace(/^`|`$/g, '')) + '</code>';
}

/* -------------------------------------------------------------- blocks ---- */

const splitLines = (t) => t.split('\n');
const isPlaceholderLine = (l) => /^\u0000[MC]\d+\u0000$/.test(l.trim());

function blocks(lines, state) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }

    const dir = line.match(/^(:{3,})\s*([a-z][\w-]*)\s*(.*)$/i);
    if (dir) {
      const marker = dir[1];
      const closeRe = new RegExp('^' + marker + '\\s*$');
      const openRe = new RegExp('^' + marker + '\\s*[a-z]', 'i');
      const body = [];
      let depth = 1;
      i += 1;
      while (i < lines.length) {
        if (openRe.test(lines[i])) depth += 1;
        else if (closeRe.test(lines[i])) {
          depth -= 1;
          if (!depth) { i += 1; break; }
        }
        body.push(lines[i]);
        i += 1;
      }
      out.push(directive(dir[2].toLowerCase(), dir[3].trim(), body.join('\n'), state));
      continue;
    }

    if (isPlaceholderLine(line)) { out.push(line.trim()); i += 1; continue; }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const raw = heading[2].replace(/\s+#+\s*$/, '').trim();
      const text = stripInline(raw);
      const id = slug(text) || 'section-' + state.headings.length;
      state.headings.push({ level, text, id });
      out.push(
        '<h' + level + ' id="' + attr(id) + '" class="kb-h kb-h' + level + '">' +
        '<a class="kb-anchor" href="#' + attr(id) + '" aria-label="Link to this section">#</a>' +
        inline(raw, state) + '</h' + level + '>'
      );
      i += 1;
      continue;
    }

    if (/^(?:---|\*\*\*|___)\s*$/.test(line)) { out.push('<hr>'); i += 1; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      // Lazy continuation carries plain prose into the quote, but a heading,
      // rule, directive, list, table or fence begins a new block -- otherwise a
      // "## Heading" right after a quotation ends up inside it, and the table of
      // contents links into the quotation.
      const interrupts = (l, k) =>
        /^(?:#{1,6}\s|:{3,}\s*[a-z]|(?:---|\*\*\*|___)\s*$|```|~~~)/i.test(l) ||
        isListItem(l) || isTableStart(lines, k);
      while (i < lines.length &&
             (/^>\s?/.test(lines[i]) || (buf.length && lines[i].trim() && !interrupts(lines[i], i)))) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push('<blockquote>' + blocks(buf, state) + '</blockquote>');
      continue;
    }

    if (isTableStart(lines, i)) {
      const buf = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { buf.push(lines[i]); i += 1; }
      out.push(table(buf, state));
      continue;
    }

    if (isListItem(line)) {
      const [html, next] = list(lines, i, state);
      out.push(html);
      i = next;
      continue;
    }

    const buf = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(?:#{1,6}\s|>|:{3,}\s*[a-z]|(?:---|\*\*\*|___)\s*$)/i.test(lines[i]) &&
      !isListItem(lines[i]) && !isTableStart(lines, i) && !isPlaceholderLine(lines[i])
    ) { buf.push(lines[i]); i += 1; }
    if (buf.length) out.push('<p>' + inline(buf.join('\n'), state) + '</p>');
    else if (i < lines.length && isPlaceholderLine(lines[i])) { out.push(lines[i].trim()); i += 1; }
  }
  return out.join('\n');
}

const isListItem = (l) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(l);
const listIndent = (l) => l.match(/^\s*/)[0].length;

function isTableStart(lines, i) {
  return Boolean(
    lines[i] && lines[i].includes('|') && lines[i + 1] &&
    lines[i + 1].includes('-') && /^\s*\|?[\s:|-]+$/.test(lines[i + 1])
  );
}

function list(lines, start, state) {
  const baseIndent = listIndent(lines[start]);
  const ordered = /^\s*\d+[.)]\s/.test(lines[start]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      const nxt = lines[i + 1];
      if (nxt && nxt.trim() && (listIndent(nxt) > baseIndent || (isListItem(nxt) && listIndent(nxt) === baseIndent))) {
        if (items.length) items[items.length - 1].push('');
        i += 1;
        continue;
      }
      break;
    }
    if (isListItem(line) && listIndent(line) === baseIndent) {
      if (/^\s*\d+[.)]\s/.test(line) !== ordered) break;
      items.push([line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')]);
      i += 1;
      continue;
    }
    if (listIndent(line) > baseIndent) {
      if (!items.length) break;
      items[items.length - 1].push(line.slice(baseIndent + 2 <= listIndent(line) ? baseIndent + 2 : listIndent(line)));
      i += 1;
      continue;
    }
    break;
  }
  const tag = ordered ? 'ol' : 'ul';
  const html = items
    .map((raw) => {
      const body = raw.join('\n').replace(/\s+$/, '');
      const multi = /\n\s*\n/.test(body) ||
        body.split('\n').slice(1).some((l) => isListItem(l) || /^:{3,}\s*[a-z]/i.test(l));
      return '<li>' + (multi ? blocks(splitLines(body), state) : inline(body, state)) + '</li>';
    })
    .join('\n');
  return ['<' + tag + ' class="kb-list">' + html + '</' + tag + '>', i];
}

function table(buf, state) {
  const cells = (row) => row.trim().replace(/^\||(?<!\\)\|$/g, '').split(/\s*(?<!\\)\|\s*/).map((c) => c.trim());
  const align = cells(buf[1]).map((c) =>
    /^:-+:$/.test(c.trim()) ? 'center' : /-+:$/.test(c.trim()) ? 'right' : ''
  );
  const cell = (tag) => (c, k) =>
    '<' + tag + (align[k] ? ' style="text-align:' + align[k] + '"' : '') + '>' + inline(c, state) + '</' + tag + '>';
  const th = cells(buf[0]).map(cell('th')).join('');
  const rows = buf.slice(2).map((r) => '<tr>' + cells(r).map(cell('td')).join('') + '</tr>').join('\n');
  return '<div class="kb-table-wrap"><table class="kb-table"><thead><tr>' + th +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* ---------------------------------------------------------- directives ---- */

function parseAttrs(spec) {
  const out = { _: spec.trim() };
  const braces = spec.match(/\{([\s\S]*)\}\s*$/);
  if (braces) {
    out._ = spec.slice(0, braces.index).trim();
    const re = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}]+))/g;
    let m;
    while ((m = re.exec(braces[1]))) {
      const v = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4];
      out[m[1]] = v;
    }
  }
  return out;
}

const CALLOUTS = {
  note: 'Note', insight: 'Insight', warning: 'Warning', pitfall: 'Common pitfall',
  assumption: 'Assumptions', intuition: 'Intuition', tip: 'Tip', proof: 'Proof',
  example: 'Example', desk: 'On the desk',
};

function directive(kind, spec, body, state) {
  const a = parseAttrs(spec);

  if (kind === 'formula') {
    const inlineMath = body.trim().match(/^\u0000M(\d+)\u0000$/);
    const rawLatex = inlineMath
      ? state.math[Number(inlineMath[1])].raw.trim()
      : body.trim().replace(PLACEHOLDER, (_, k, i) => (k === 'M' ? state.math[Number(i)].raw : '')).trim();
    const name = a.name || a._ || '';
    const usedIn = String(a['used-in'] || a.usedin || '').split(',').map((s) => s.trim()).filter(Boolean);
    let id = a.id || slug(name) || 'formula-' + (state.formulas.length + 1);
    if (state.formulas.some((f) => f.id === id)) {
      let n = 2;
      while (state.formulas.some((f) => f.id === id + '-' + n)) n += 1;
      id = id + '-' + n;
    }
    state.formulas.push({ id, name, latex: rawLatex, usedIn, note: a.note || '' });
    const idx = state.math.push({ raw: rawLatex, display: true }) - 1;
    return [
      '<figure class="kb-formula" id="' + attr(id) + '" data-formula="' + attr(id) + '">',
      '<figcaption class="kb-formula-head"><span class="kb-formula-tag">Key formula</span>',
      name ? '<span class="kb-formula-name">' + inline(name, state) + '</span>' : '',
      '<button class="kb-formula-copy" type="button" data-latex="' + attr(rawLatex) + '" title="Copy LaTeX">copy</button>',
      '</figcaption>',
      '<div class="kb-formula-body"> \u0000M' + idx + '\u0000 </div>',
      a.note ? '<p class="kb-formula-note">' + inline(a.note, state) + '</p>' : '',
      usedIn.length
        ? '<footer class="kb-formula-foot"><span>Used in</span>' +
          usedIn.map((u) => '<span class="kb-chip">' + escapeHtml(u) + '</span>').join('') + '</footer>'
        : '',
      '</figure>',
    ].join('');
  }

  if (kind === 'derivation' || kind === 'details' || kind === 'expand') {
    const title = a._ || a.title || 'Derivation';
    return '<details class="kb-derivation"' + (a.open ? ' open' : '') + '><summary>' +
      inline(title, state) + '</summary><div class="kb-derivation-body">' +
      blocks(splitLines(body), state) + '</div></details>';
  }

  if (kind === 'module') {
    const name = a._ || a.name;
    if (!name) { state.warnings.push('module directive is missing a name'); return ''; }
    let config = {};
    const json = body.replace(PLACEHOLDER, (_, k, i) => (k === 'C' ? state.code[Number(i)].replace(/^```\w*\n?|```$/g, '') : '')).trim();
    if (json) {
      try { config = JSON.parse(json); }
      catch (e) { state.warnings.push('module "' + name + '": config is not valid JSON (' + e.message + ')'); }
    }
    state.modules.push(name);
    return '<div class="kb-module" data-module="' + attr(name) + '" data-config="' +
      attr(JSON.stringify(config)) + '"><div class="kb-module-shell">' +
      '<div class="kb-module-loading">Loading interactive module &ldquo;' + escapeHtml(name) + '&rdquo;&hellip;</div>' +
      '</div></div>';
  }

  if (kind === 'grid' || kind === 'columns') {
    return '<div class="kb-grid" data-cols="' + attr(a.cols || a._ || 2) + '">' +
      blocks(splitLines(body), state) + '</div>';
  }

  if (CALLOUTS[kind]) {
    const title = a._ || a.title || CALLOUTS[kind];
    return '<aside class="kb-callout kb-callout--' + attr(kind) + '">' +
      '<div class="kb-callout-title">' + inline(title, state) + '</div>' +
      '<div class="kb-callout-body">' + blocks(splitLines(body), state) + '</div></aside>';
  }

  state.warnings.push('unknown directive ":::' + kind + '" (rendered as a plain block)');
  return '<div class="kb-block kb-block--' + attr(kind) + '">' + blocks(splitLines(body), state) + '</div>';
}

/* -------------------------------------------------------------- inline ---- */

function stripInline(s) {
  return String(s)
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => label || id)
    .replace(/\?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim();
}

function inline(text, state) {
  let s = escapeHtml(text);

  s = s.replace(/\?\[([^\]]+)\]\(([^)]+)\)/g,
    (_, term, def) => '<abbr class="kb-term" title="' + attr(unesc(def)) + '" tabindex="0">' + term + '</abbr>');

  s = s.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, rawId, label) => {
    const id = unesc(rawId).trim();
    state.links.push(id);
    const resolved = state.ctx.resolveLink ? state.ctx.resolveLink(id) : null;
    if (!resolved || resolved.missing) {
      state.warnings.push('wiki link [[' + id + ']] does not match any concept id');
      return '<a class="kb-link kb-link--missing" href="#" data-missing="' + attr(id) +
        '" title="No concept with id &quot;' + attr(id) + '&quot; yet">' + (label || id) + '</a>';
    }
    return '<a class="kb-link" href="' + attr(resolved.href) + '" data-concept="' + attr(id) + '">' +
      (label || escapeHtml(resolved.title)) + '</a>';
  });

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\)/g, (_, t, href, title) => {
    const url = unesc(href);
    const ext = /^https?:/i.test(url);
    return '<a href="' + attr(url) + '"' + (title ? ' title="' + attr(title) + '"' : '') +
      (ext ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + t + '</a>';
  });

  return s
    .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,;:!?])/g, '$1<em>$2</em>')
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,;:!?])/g, '$1<em>$2</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/ {2,}\n/g, '<br>\n')
    // Markdown backslash escapes, resolved last so the characters they were
    // protecting have already been through every pattern above. `\$` is the
    // one that matters here: it is how you write a dollar amount without
    // starting a formula, and leaving it unresolved printed the backslash.
    .replace(/\\([\\`*_{}\[\]()#+\-.!$~<>|])/g, '$1');
}

const unesc = (s) =>
  String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Plain-text projection of markdown, for the search index and summaries. */
function toText(src) {
  return String(src)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^:{3,}.*$/gm, ' ')
    .replace(/\$\$?([^$]*)\$\$?/g, ' $1 ')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => label || id)
    .replace(/\?\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { render, escapeHtml, slug, stripInline, toText };
