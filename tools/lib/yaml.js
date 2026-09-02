'use strict';
/**
 * Minimal YAML-subset parser, sufficient for concept frontmatter.
 *
 * Supported: nested maps, block sequences ("- x"), flow sequences ("[a, b]"),
 * flow maps ("{a: 1}"), quoted / plain scalars, numbers, booleans, null,
 * block scalars ("|", "|-", ">", ">-") and "#" comments.
 *
 * Deliberately NOT supported: anchors, aliases, tags, multi-document files,
 * complex keys. If you need those, you are over-thinking your frontmatter.
 */

function parse(src) {
  // Blank and "#" lines are kept, not dropped. They are noise to the structural
  // parser but content to a block scalar: an answer written as three paragraphs
  // must come out as three paragraphs, and a "# heading" indented inside a "|"
  // block is a markdown heading, not a YAML comment. Only the readers below
  // decide which they are -- this pass no longer guesses.
  const lines = [];
  src.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/\t/g, '  ');
    const text = line.trim();
    lines.push({
      indent: line.match(/^ */)[0].length,
      text,
      blank: text === '',
      comment: text.startsWith('#'),
      n: i + 1,
      raw: line,
    });
  });
  const first = nextStructural(lines, 0);
  if (first >= lines.length) return {};
  const [value] = parseBlock(lines, first, lines[first].indent);
  return value;
}

/** Index of the next line the structural parser should look at. */
function nextStructural(lines, pos) {
  let i = pos;
  while (i < lines.length && (lines[i].blank || lines[i].comment)) i += 1;
  return i;
}

/**
 * Blank lines carry no indentation of their own, so they belong to whatever
 * block resumes after them. True when the run at `pos` is followed by a line
 * still deeper than `indent` -- i.e. the enclosing block continues.
 */
function continuesBelow(lines, pos, indent) {
  const i = nextStructural(lines, pos);
  return i < lines.length && lines[i].indent > indent;
}

function parseBlock(lines, pos, indent) {
  pos = nextStructural(lines, pos);
  if (pos >= lines.length) return [null, pos];
  return lines[pos].text.startsWith('- ') || lines[pos].text === '-'
    ? parseSeq(lines, pos, indent)
    : parseMap(lines, pos, indent);
}

function parseSeq(lines, pos, indent) {
  const out = [];
  for (;;) {
    pos = nextStructural(lines, pos);
    if (pos >= lines.length || lines[pos].indent !== indent) break;
    const line = lines[pos];
    if (!(line.text === '-' || line.text.startsWith('- '))) break;
    const rest = line.text === '-' ? '' : line.text.slice(2).trim();
    pos += 1;
    if (!rest) {
      const [val, next] = childBlock(lines, pos, indent);
      out.push(val);
      pos = next;
    } else if (isMapEntry(rest)) {
      // "- key: value" opens an inline map whose members align past the dash.
      const virtual = [{ indent: indent + 2, text: rest, n: line.n, blank: false, comment: false }];
      let scan = pos;
      while (scan < lines.length &&
             (lines[scan].blank || lines[scan].comment
               ? continuesBelow(lines, scan, indent)
               : lines[scan].indent > indent)) {
        virtual.push(lines[scan++]);
      }
      const [val] = parseMap(virtual, 0, indent + 2);
      out.push(val);
      pos = scan;
    } else {
      const r = scalar(rest, lines, pos, indent);
      out.push(r.value);
      pos = r.next;
    }
  }
  return [out, pos];
}

function parseMap(lines, pos, indent) {
  const out = {};
  for (;;) {
    pos = nextStructural(lines, pos);
    if (pos >= lines.length || lines[pos].indent !== indent) break;
    const line = lines[pos];
    if (line.text.startsWith('- ')) break;
    const m = line.text.match(/^([^:]+):(?:\s+(.*))?$/);
    if (!m) throw new Error(`yaml: cannot parse line ${line.n}: "${line.text}"`);
    const key = unquote(m[1].trim());
    const rest = (m[2] || '').trim();
    pos += 1;
    if (!rest) {
      const [val, next] = childBlock(lines, pos, indent);
      out[key] = val;
      pos = next;
    } else if (/^[|>][-+]?$/.test(rest)) {
      const [val, next] = blockScalar(lines, pos, indent, rest);
      out[key] = val;
      pos = next;
    } else {
      const r = scalar(rest, lines, pos, indent);
      out[key] = r.value;
      pos = r.next;
    }
  }
  return [out, pos];
}

/** A nested block belonging to a key/dash that had no inline value. */
function childBlock(lines, pos, indent) {
  const at = nextStructural(lines, pos);
  if (at < lines.length && lines[at].indent > indent) {
    return parseBlock(lines, at, lines[at].indent);
  }
  return [null, pos];
}

function blockScalar(lines, pos, indent, marker) {
  const fold = marker[0] === '>';
  const chomp = marker[1] || '';
  const body = [];
  let base = null;
  while (pos < lines.length) {
    if (lines[pos].blank) {
      // Absorb the blank run only if the block continues past it; otherwise it
      // is the gap before the next key and the scalar ends here.
      if (!continuesBelow(lines, pos, indent)) break;
      while (lines[pos].blank) { body.push(''); pos += 1; }
      continue;
    }
    // Past this point a "#" line is inside the block, so it is literal text.
    if (lines[pos].indent <= indent) break;
    if (base === null) base = lines[pos].indent;
    body.push(' '.repeat(Math.max(0, lines[pos].indent - base)) + lines[pos].text);
    pos += 1;
  }

  let text;
  if (fold) {
    // Folding joins the lines of a paragraph with a space; a blank line is a
    // paragraph break and survives as a newline.
    const paras = [[]];
    body.forEach((l) => (l === '' ? paras.push([]) : paras[paras.length - 1].push(l)));
    text = paras.map((p) => p.join(' ')).join('\n');
  } else {
    text = body.join('\n');
  }
  if (chomp === '-') text = text.replace(/\n+$/, '');
  else text += '\n';
  return [text, pos];
}

function isMapEntry(s) {
  return /^(?:"[^"]*"|'[^']*'|[^:{}[\]]+):(?:\s|$)/.test(s);
}

function scalar(rest, lines, pos, indent) {
  // Flow collections may wrap across lines; join until brackets balance.
  if (/^[[{]/.test(rest)) {
    let text = rest;
    for (;;) {
      const at = nextStructural(lines, pos);
      if (balanced(text) || at >= lines.length || lines[at].indent <= indent) break;
      text += ' ' + lines[at].text;
      pos = at + 1;
    }
    return { value: parseFlow(text), next: pos };
  }
  return { value: literal(stripComment(rest)), next: pos };
}

function balanced(s) {
  let depth = 0, quote = null;
  for (const ch of s) {
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '[' || ch === '{') depth += 1;
    else if (ch === ']' || ch === '}') depth -= 1;
  }
  return depth === 0;
}

function stripComment(s) {
  let quote = null;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i).trim();
  }
  return s.trim();
}

function splitFlow(body) {
  const parts = [];
  let depth = 0, quote = null, buf = '';
  for (const ch of body) {
    if (quote) { buf += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === '[' || ch === '{') depth += 1;
    if (ch === ']' || ch === '}') depth -= 1;
    if (ch === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf);
  return parts.map((p) => p.trim()).filter((p) => p !== '');
}

function parseFlow(text) {
  const s = text.trim();
  if (s.startsWith('[')) {
    return splitFlow(s.slice(1, s.lastIndexOf(']'))).map(parseFlowValue);
  }
  if (s.startsWith('{')) {
    const out = {};
    for (const part of splitFlow(s.slice(1, s.lastIndexOf('}')))) {
      const i = part.indexOf(':');
      if (i === -1) continue;
      out[unquote(part.slice(0, i).trim())] = parseFlowValue(part.slice(i + 1).trim());
    }
    return out;
  }
  return literal(s);
}

const parseFlowValue = (v) => (/^[[{]/.test(v) ? parseFlow(v) : literal(v));

function unquote(s) {
  if (/^"[\s\S]*"$/.test(s)) return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
  if (/^'[\s\S]*'$/.test(s)) return s.slice(1, -1).replace(/''/g, "'");
  return s;
}

function literal(s) {
  if (/^["']/.test(s)) return unquote(s);
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true' || s === 'yes') return true;
  if (s === 'false' || s === 'no') return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d*\.\d+$/.test(s)) return parseFloat(s);
  return s;
}

/** Split "---\n<yaml>\n---\n<body>" into { data, body }. */
function frontmatter(src) {
  const text = src.replace(/^﻿/, '');
  const m = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) return { data: {}, body: text };
  return { data: parse(m[1]) || {}, body: text.slice(m[0].length) };
}

module.exports = { parse, frontmatter };
