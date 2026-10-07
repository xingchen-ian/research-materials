/* Parse the literature index and digest briefs in the browser. No build step. */
(function (root) {
  'use strict';

  function normalizeDoi(raw) {
    let s = String(raw || '').trim();
    s = s.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
    s = s.replace(/[)\]）】.,;:*>，。、]+$/g, '');
    return s.toLowerCase();
  }

  function splitRow(line) {
    let inner = line.trim();
    if (inner.startsWith('|')) inner = inner.slice(1);
    if (inner.endsWith('|')) inner = inner.slice(0, -1);
    return inner.split('|').map(function (cell) {
      return cell.trim();
    });
  }

  function isSeparator(line) {
    const cells = splitRow(line);
    if (!cells.length) return false;
    return cells.every(function (cell) {
      return /^:?-{3,}:?$/.test(cell);
    });
  }

  function parseDoiCell(cell) {
    const link = cell.match(/\[([^\]]*)\]\(([^)\s]+)\)/);
    if (link) {
      const href = link[2].trim();
      const label = link[1].trim() || href.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
      const doi = normalizeDoi(href) || normalizeDoi(label);
      return { doi: doi, doiLabel: label, doiHref: href };
    }
    const bare = cell.match(/10\.\d{4,9}\/[^\s)\]<>，,；;）】]+/i);
    if (bare) {
      const doi = normalizeDoi(bare[0]);
      return { doi: doi, doiLabel: bare[0].replace(/[)\]）】.,;:*>，。、]+$/g, ''), doiHref: 'https://doi.org/' + doi };
    }
    return { doi: '', doiLabel: '', doiHref: '' };
  }

  function parseIndex(markdown) {
    const lines = String(markdown || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    let headerIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*\|/.test(lines[i]) && lines[i].indexOf('题目') !== -1 && lines[i].indexOf('状态') !== -1) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) {
      throw new Error('文献表里没有找到表头。需要有「题目」和「状态」两列。');
    }
    const headers = splitRow(lines[headerIdx]);
    const need = ['#', '题目', '作者', '年份', 'Venue', 'DOI', '课题', '期', '状态', '备注'];
    for (let n = 0; n < need.length; n++) {
      if (headers.indexOf(need[n]) === -1) {
        throw new Error('文献表缺少列：「' + need[n] + '」。');
      }
    }
    const papers = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!/^\s*\|/.test(line)) {
        if (papers.length) break;
        continue;
      }
      if (isSeparator(line)) continue;
      const cells = splitRow(line);
      const row = {};
      headers.forEach(function (name, idx) {
        row[name] = cells[idx] || '';
      });
      const title = row['题目'];
      const doiCell = parseDoiCell(row['DOI']);
      if (!title && !doiCell.doi) continue;
      const year = parseInt(row['年份'], 10);
      const topics = row['课题'].split(/[；;]/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      papers.push({
        n: parseInt(row['#'], 10) || papers.length + 1,
        title: title,
        authors: row['作者'],
        year: Number.isFinite(year) ? year : 0,
        yearLabel: row['年份'],
        venue: row['Venue'],
        doi: doiCell.doi,
        doiLabel: doiCell.doiLabel,
        doiHref: doiCell.doiHref,
        topics: topics,
        issueLabel: row['期'],
        status: row['状态'],
        note: row['备注']
      });
    }
    return papers;
  }

  function parseBrief(markdown) {
    const lines = String(markdown || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    const blocks = [];
    let current = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^#{1,6}\s+/.test(line)) {
        if (current) blocks.push(current);
        current = null;
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        if (current) blocks.push(current);
        current = [line];
        continue;
      }
      if (current) current.push(line);
    }
    if (current) blocks.push(current);

    const fieldRe = /^\s*(?:[-*+]\s*)?(做了什么|跟你的关系|相关性|相关)\s*[：:]\s*(.*?)\s*$/;
    const doiRe = /10\.\d{4,9}\/[^\s)\]<>，,；;）】]+/i;
    const notes = [];
    blocks.forEach(function (blockLines) {
      const text = blockLines.join('\n');
      const doiMatch = text.match(doiRe);
      if (!doiMatch) return;
      let did = '';
      let rel = '';
      blockLines.forEach(function (line) {
        const m = line.match(fieldRe);
        if (!m) return;
        if (m[1] === '做了什么') did = m[2].trim();
        else rel = m[2].trim();
      });
      notes.push({
        doi: normalizeDoi(doiMatch[0]),
        did: did,
        relation: rel
      });
    });
    return notes;
  }

  function parseIssueMeta(markdown) {
    const text = String(markdown || '').replace(/^\uFEFF/, '');
    const h1Match = text.match(/^#\s+(.+)$/m);
    const h1 = h1Match ? h1Match[1].trim() : '';
    const noMatch = h1.match(/第\s*(\d+)\s*期/);
    const conclMatch = text.match(/\*{0,2}本期结论\*{0,2}\s*[：:]\*{0,2}\s*(.+)/);
    let conclusion = conclMatch ? conclMatch[1].trim() : '';
    conclusion = conclusion.replace(/\*+/g, '').trim();
    return {
      h1: h1,
      issueNo: noMatch ? noMatch[1] : '',
      conclusion: conclusion
    };
  }

  root.DigestParse = {
    normalizeDoi: normalizeDoi,
    parseIndex: parseIndex,
    parseBrief: parseBrief,
    parseIssueMeta: parseIssueMeta
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
