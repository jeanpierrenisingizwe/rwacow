/**
 * Converts the markdown docs into styled PDF files using headless Edge/Chrome.
 * Usage: node docs/build-pdf.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DOCS_DIR = __dirname;
const ROOT = path.join(__dirname, '..');

// Files to convert: [source markdown, output name, title]
const FILES = [
  [path.join(ROOT, 'README.md'),          'RwaCow-Documentation.pdf', 'RwaCow — System Documentation'],
  [path.join(DOCS_DIR, 'QUICK-START.md'), 'RwaCow-Quick-Start.pdf',   'RwaCow — Quick Start Guide'],
  [path.join(DOCS_DIR, 'DEMO-SCRIPT.md'), 'RwaCow-Demo-Script.pdf',   'RwaCow — Presentation Demo Script'],
  [path.join(DOCS_DIR, 'DEPLOYMENT.md'),  'RwaCow-Deployment.pdf',    'RwaCow — Deployment Guide'],
];

// ── Minimal, dependency-free Markdown → HTML converter ──
function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split(/\r?\n/);
  let html = '';
  let inTable = false;
  let tableRows = [];
  let inCode = false;
  let codeBuf = [];
  let inList = false;

  const inline = (t) => {
    // escape first
    t = esc(t);
    // bold
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // inline code
    t = t.replace(/`([^`]+?)`/g, '<code>$1</code>');
    // links
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return t;
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const header = tableRows[0];
    const body = tableRows.slice(2); // skip the |---| separator row
    html += '<table><thead><tr>';
    header.forEach(c => html += `<th>${inline(c.trim())}</th>`);
    html += '</tr></thead><tbody>';
    body.forEach(row => {
      html += '<tr>';
      row.forEach(c => html += `<td>${inline(c.trim())}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    tableRows = [];
    inTable = false;
  };

  const flushList = () => {
    if (inList) { html += '</ul>'; inList = false; }
  };

  for (const raw of lines) {
    const line = raw;

    // Code fences
    if (/^```/.test(line)) {
      if (inCode) {
        html += `<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`;
        codeBuf = []; inCode = false;
      } else {
        flushList(); flushTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // Tables
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushList();
      inTable = true;
      tableRows.push(line.trim().replace(/^\||\|$/g, '').split('|'));
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { flushList(); html += '<hr>'; continue; }

    // Headings
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flushList();
      const level = m[1].length;
      html += `<h${level}>${inline(m[2])}</h${level}>`;
      continue;
    }

    // List items
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }

    // Numbered list items (render as list too)
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }

    // Blank line
    if (line.trim() === '') { flushList(); continue; }

    // Paragraph
    flushList();
    html += `<p>${inline(line)}</p>`;
  }
  flushList(); flushTable();
  if (inCode) html += `<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`;
  return html;
}

const STYLE = `
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #1f2937; line-height: 1.6; font-size: 12px;
    max-width: 800px; margin: 0 auto; padding: 24px;
  }
  h1 { color: #14532d; font-size: 26px; border-bottom: 3px solid #16a34a; padding-bottom: 8px; margin-top: 0; }
  h2 { color: #15803d; font-size: 19px; border-bottom: 1px solid #d1fae5; padding-bottom: 4px; margin-top: 26px; }
  h3 { color: #166534; font-size: 15px; margin-top: 20px; }
  h4 { color: #374151; font-size: 13px; }
  p { margin: 8px 0; }
  a { color: #16a34a; text-decoration: none; }
  code {
    background: #f0fdf4; color: #15803d; padding: 1px 5px;
    border-radius: 4px; font-family: 'Consolas', monospace; font-size: 11px;
  }
  pre {
    background: #14532d; color: #ecfdf5; padding: 12px 14px;
    border-radius: 8px; overflow-x: auto; font-size: 11px;
  }
  pre code { background: none; color: #ecfdf5; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 11px; }
  th { background: #16a34a; color: #fff; text-align: left; padding: 7px 10px; }
  td { border: 1px solid #e5e7eb; padding: 6px 10px; }
  tr:nth-child(even) td { background: #f9fafb; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  ul { margin: 8px 0; padding-left: 22px; }
  li { margin: 3px 0; }
  strong { color: #111827; }
  @page { margin: 1.5cm; size: A4; }
`;

function findBrowser() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find(p => fs.existsSync(p));
}

const browser = findBrowser();
if (!browser) {
  console.error('❌ No Edge or Chrome found. Cannot generate PDF.');
  process.exit(1);
}
console.log('Using browser:', browser);

for (const [src, outName, title] of FILES) {
  if (!fs.existsSync(src)) { console.warn('Skip (missing):', src); continue; }
  const md = fs.readFileSync(src, 'utf8');
  const bodyHtml = mdToHtml(md);
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${STYLE}</style></head><body>${bodyHtml}</body></html>`;

  const tmpHtml = path.join(DOCS_DIR, outName.replace('.pdf', '.tmp.html'));
  const outPdf = path.join(DOCS_DIR, outName);
  fs.writeFileSync(tmpHtml, fullHtml);

  try {
    execSync(
      `"${browser}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outPdf}" "file:///${tmpHtml.replace(/\\/g, '/')}"`,
      { stdio: 'ignore', timeout: 60000 }
    );
    console.log('✅ Created', outName);
  } catch (e) {
    console.error('❌ Failed for', outName, e.message);
  } finally {
    if (fs.existsSync(tmpHtml)) fs.unlinkSync(tmpHtml);
  }
}

console.log('\nDone. PDFs are in the docs/ folder.');
