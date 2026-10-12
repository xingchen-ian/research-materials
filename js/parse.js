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

  function parseIndex(markdown, mode) {
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
    const flexible = mode === 'flexible';
    const need = flexible
      ? ['#', '题目', '作者', '年份', 'Venue', 'DOI', '状态']
      : ['#', '题目', '作者', '年份', 'Venue', 'DOI', '课题', '期', '状态', '备注'];
    for (let n = 0; n < need.length; n++) {
      if (headers.indexOf(need[n]) === -1) {
        throw new Error('文献表缺少列：「' + need[n] + '」。');
      }
    }
    const topicCol = headers.indexOf('课题') !== -1 ? '课题' : (headers.indexOf('标签') !== -1 ? '标签' : '');
    if (flexible && !topicCol) {
      throw new Error('文献表缺少列：「标签」。');
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
      const topics = String(row[topicCol] || '').split(/[；;]/).map(function (s) {
        return s.trim();
      }).filter(Boolean);
      const gaps = String(row['填补空白'] || '').split(/[；;]/).map(function (s) {
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
        gaps: gaps,
        newGap: row['新空白'] || '',
        issueLabel: row['期'] || '',
        status: row['状态'],
        note: row['备注'] || ''
      });
    }
    return papers;
  }

  function parseGapCatalog(markdown) {
    const lines = String(markdown || '').replace(/^\uFEFF/, '').split(/\r?\n/);
    let headerIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*\|/.test(lines[i]) && lines[i].indexOf('#') !== -1 && lines[i].indexOf('空白') !== -1) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx < 0) return [];
    const headers = splitRow(lines[headerIdx]);
    const nameCol = headers.filter(function (name) {
      return name.indexOf('空白') !== -1;
    })[0] || '';
    const gaps = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!/^\s*\|/.test(line)) {
        if (gaps.length) break;
        continue;
      }
      if (isSeparator(line)) continue;
      const cells = splitRow(line);
      const row = {};
      headers.forEach(function (name, idx) {
        row[name] = cells[idx] || '';
      });
      const id = String(row['#'] || '').trim();
      if (!id) continue;
      gaps.push({
        id: id,
        name: nameCol ? row[nameCol] : '',
        relevance: row['相关度'] || '',
        fill: row['填补程度（初判）'] || row['填补程度'] || '',
        note: row['说明'] || ''
      });
    }
    return gaps;
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
    const noMatch = h1.match(/第\s*(\d+[a-z]?)\s*期/);
    const conclMatch = text.match(/\*{0,2}本期结论\*{0,2}\s*[：:]\*{0,2}\s*(.+)/);
    let conclusion = conclMatch ? conclMatch[1].trim() : '';
    conclusion = conclusion.replace(/\*+/g, '').trim();
    return {
      h1: h1,
      issueNo: noMatch ? noMatch[1] : '',
      conclusion: conclusion
    };
  }

  function doiSlug(raw) {
    const doi = normalizeDoi(raw);
    if (!doi) return '';
    return doi.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function stripFrontmatter(markdown) {
    const text = String(markdown || '').replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/);
    if (!lines.length || lines[0].trim() !== '---') return text;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') return lines.slice(i + 1).join('\n').replace(/^\n/, '');
    }
    return text;
  }

  root.DigestParse = {
    normalizeDoi: normalizeDoi,
    doiSlug: doiSlug,
    stripFrontmatter: stripFrontmatter,
    parseIndex: parseIndex,
    parseGapCatalog: parseGapCatalog,
    parseBrief: parseBrief,
    parseIssueMeta: parseIssueMeta
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
