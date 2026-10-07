(function () {
  'use strict';

  const TOPIC_ORDER = ['来自生活', '人机协作', '三林老街', 'AR·MR', '教学'];
  const STATUS_ORDER = ['待读', '精读', '已入库', '不用'];

  const state = {
    papers: [],
    issues: [],
    tag: '',
    status: '',
    sort: 'issue',
    q: '',
    reflect: false,
    note: false,
    open: new Set(),
    route: null,
    ready: false
  };

  const app = document.getElementById('app');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function safeHref(href) {
    const trimmed = String(href || '').trim();
    if (!trimmed) return '';
    try {
      const url = new URL(trimmed, window.location.href);
      if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
        return url.href;
      }
    } catch (err) {
      return '';
    }
    return '';
  }

  function fetchText(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(path + '（' + res.status + '）');
      return res.text();
    });
  }

  function orderedLabels(preferred, values) {
    const seen = Object.create(null);
    const out = [];
    preferred.forEach(function (name) {
      if (!seen[name]) {
        seen[name] = true;
        out.push(name);
      }
    });
    values.forEach(function (name) {
      if (name && !seen[name]) {
        seen[name] = true;
        out.push(name);
      }
    });
    return out;
  }

  function matchQuery(paper) {
    if (!state.q) return true;
    const blob = [
      paper.title,
      paper.authors,
      paper.note,
      paper.did,
      paper.relation,
      paper.venue,
      paper.doiLabel,
      paper.doi,
      paper.topics.join(' '),
      paper.reflection,
      paper.notes
    ].join('\n').toLowerCase();
    return blob.indexOf(state.q) !== -1;
  }

  function matchPaper(paper, tag, status, reflect, note) {
    if (!matchQuery(paper)) return false;
    if (tag && paper.topics.indexOf(tag) === -1) return false;
    if (status && paper.status !== status) return false;
    const wantReflection = reflect === undefined ? state.reflect : reflect;
    const wantNote = note === undefined ? state.note : note;
    if (wantReflection && !paper.hasReflection) return false;
    if (wantNote && !paper.hasNotes) return false;
    return true;
  }

  const GITHUB_REPO = 'xingchen-ian/research-materials';

  function todayStamp() {
    const d = new Date();
    const month = String(d.getMonth() + 1);
    const day = String(d.getDate());
    return d.getFullYear() + '-' + (month.length < 2 ? '0' + month : month) + '-' + (day.length < 2 ? '0' + day : day);
  }

  function reflectionTemplate(paper) {
    return [
      '# ' + (paper.title || '精读'),
      '',
      '- DOI：' + (paper.doiLabel || paper.doi),
      '- 作者：' + (paper.authors || ''),
      '- 年份：' + (paper.yearLabel || ''),
      '- 日期：' + todayStamp(),
      '',
      '## 主要观点',
      '',
      '',
      '## 我的看法',
      '',
      '',
      '## 对我课题的用处',
      '',
      '',
      '## 想引用的句子',
      '',
      ''
    ].join('\n');
  }

  function reflectionHref(paper) {
    const file = 'data/reflections/' + paper.slug + '.md';
    if (paper.hasReflection) {
      return 'https://github.com/' + GITHUB_REPO + '/edit/main/' + file;
    }
    return 'https://github.com/' + GITHUB_REPO + '/new/main?filename=' +
      encodeURIComponent(file) + '&value=' + encodeURIComponent(reflectionTemplate(paper));
  }

  function reflectionActions(paper, withHint) {
    if (!paper.slug) {
      return '<p class="reflect-hint">这篇没有 DOI，写不了 reflection。</p>';
    }
    const label = paper.hasReflection ? '编辑 reflection' : '写 reflection';
    const hint = withHint
      ? '<p class="reflect-hint">在 GitHub 里直接提交到 main。网页要一两分钟才更新，然后刷新。</p>'
      : '';
    return '<div class="reflect-actions"><a class="reflect-btn" href="' + esc(reflectionHref(paper)) + '" target="_blank" rel="noopener noreferrer">' +
      label + '<span class="sr-only">（新窗口，GitHub）</span></a>' + hint + '</div>';
  }

  function sideDoc(kind, title, pending, body, extra) {
    if (pending || !String(body || '').trim()) {
      const msg = pending
        ? '文件已经在仓库里，Pages 还在更新。一两分钟后刷新。'
        : '这篇还没有正文。';
      return '<div class="side-doc ' + kind + '"><p class="reflect-kicker">' + title + '</p><p class="muted">' + msg + '</p>' + (extra || '') + '</div>';
    }
    return '<div class="side-doc ' + kind + '"><p class="reflect-kicker">' + title + '</p><div class="markdown">' +
      renderMarkdown(body) + '</div>' + (extra || '') + '</div>';
  }

  function notesBlock(paper) {
    if (!paper.hasNotes) return '';
    return sideDoc('reading-notes', '精读笔记', paper.notesPending, paper.notes, '');
  }

  function reflectionBlock(paper) {
    if (!paper.hasReflection) return '';
    return sideDoc('reflection', '我的 reflection', paper.reflectionPending, paper.reflection, reflectionActions(paper, false));
  }

  function sortedPapers(list) {
    return list.slice().sort(function (a, b) {
      if (state.sort === 'year') {
        const yearDiff = (b.year || 0) - (a.year || 0);
        if (yearDiff) return yearDiff;
      }
      if (a.issueDate !== b.issueDate) {
        if (!a.issueDate) return 1;
        if (!b.issueDate) return -1;
        return a.issueDate < b.issueDate ? 1 : -1;
      }
      return a.n - b.n;
    });
  }

  function visiblePapers() {
    return sortedPapers(state.papers.filter(function (paper) {
      return matchPaper(paper, state.tag, state.status);
    }));
  }

  function parseHash() {
    const raw = (location.hash || '#/papers').replace(/^#/, '');
    const parts = raw.split('/').filter(Boolean).map(decodeURIComponent);
    if (parts[0] === 'issues' && parts[1]) return { name: 'issue', date: parts[1] };
    if (parts[0] === 'issues') return { name: 'issues' };
    return { name: 'papers' };
  }

  function setCurrentNav(name) {
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      if (link.getAttribute('data-nav') === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function showError(message) {
    app.innerHTML = '<p class="banner" role="alert">' + esc(message) + '</p>';
  }

  function configureMarked() {
    if (!window.marked || configureMarked.done) return;
    window.marked.use({
      renderer: {
        link: function (token) {
          const text = this.parser.parseInline(token.tokens);
          const href = safeHref(token.href);
          const title = token.title ? ' title="' + esc(token.title) + '"' : '';
          if (!href) return text;
          return '<a href="' + esc(href) + '"' + title + ' target="_blank" rel="noopener noreferrer">' + text + '</a>';
        },
        html: function (token) {
          return esc(token.text || '');
        }
      }
    });
    configureMarked.done = true;
  }

  function renderMarkdown(md) {
    configureMarked();
    if (!window.marked) return '<p>Markdown 组件没有载入。</p>';
    return window.marked.parse(md, { gfm: true, breaks: false });
  }

  function paperCard(paper) {
    const tags = paper.topics.map(function (topic) {
      return '<button type="button" class="tag" data-tag="' + esc(topic) + '">' + esc(topic) + '</button>';
    }).join('');
    const doiHref = safeHref(paper.doiHref);
    const doi = doiHref
      ? '<a href="' + esc(doiHref) + '" target="_blank" rel="noopener noreferrer">' + esc(paper.doiLabel || paper.doi) + '<span class="sr-only">（新窗口打开）</span></a>'
      : '<span class="muted">没有 DOI</span>';
    const issue = paper.issueDate
      ? '<a class="issue-link" href="#/issues/' + esc(paper.issueDate) + '">' + esc(paper.issueDate) + '</a>'
      : esc(paper.issueLabel || '—');
    const note = paper.note
      ? '<p class="remark"><span class="k">备注</span> ' + esc(paper.note) + '</p>'
      : '';
    const did = paper.did
      ? '<p>' + esc(paper.did) + '</p>'
      : '<p class="muted">摘要里没有这一栏。</p>';
    const rel = paper.relation
      ? '<p>' + esc(paper.relation) + '</p>'
      : '<p class="muted">摘要里没有这一栏。</p>';
    const missing = !paper.did && !paper.relation
      ? '<p class="missing">按 DOI 没有在各期摘要里找到这篇的笔记。</p>'
      : '';
    const open = state.open.has(String(paper.n)) ? ' open' : '';
    return (
      '<article class="card' + (paper.hasNotes ? ' has-notes' : '') + (paper.hasReflection ? ' has-reflection' : '') + '">' +
        '<div class="card-top">' +
          '<span class="num">' + esc(paper.n) + '</span>' +
          '<span class="issue-slot">期 ' + issue + '</span>' +
          '<span class="card-marks">' +
            (paper.hasNotes ? '<span class="notes-badge">有精读笔记</span>' : '') +
            (paper.hasReflection ? '<span class="reflect-badge">有 reflection</span>' : '') +
            '<span class="status" data-status="' + esc(paper.status) + '">' + esc(paper.status || '未标') + '</span>' +
          '</span>' +
        '</div>' +
        '<h2 class="paper-title">' + esc(paper.title) + '</h2>' +
        '<p class="meta">' + esc(paper.authors) + ' · ' + esc(paper.yearLabel || '年份不详') + ' · ' + esc(paper.venue) + '</p>' +
        '<p class="doi">' + doi + '</p>' +
        (tags ? '<div class="tags">' + tags + '</div>' : '') +
        note +
        reflectionActions(paper, true) +
        '<details data-id="' + esc(paper.n) + '"' + open + '>' +
          '<summary><span class="when-closed">展开笔记</span><span class="when-open">收起笔记</span></summary>' +
          '<div class="notes">' +
            missing +
            '<h3>做了什么</h3>' + did +
            '<h3>跟你的关系</h3>' + rel +
          '</div>' +
          notesBlock(paper) +
          reflectionBlock(paper) +
        '</details>' +
      '</article>'
    );
  }

  function chip(label, pressed, attrs, count) {
    return '<button type="button" class="chip" aria-pressed="' + (pressed ? 'true' : 'false') + '" ' + attrs + '>' +
      esc(label) + '<span class="n">' + count + '</span></button>';
  }

  function renderPapersShell() {
    const topics = orderedLabels(TOPIC_ORDER, state.papers.flatMap(function (p) { return p.topics; }));
    const statuses = orderedLabels(STATUS_ORDER, state.papers.map(function (p) { return p.status; }).filter(Boolean));
    const topicChips = chip('全部', state.tag === '', 'data-filter="tag" data-value=""', 0) +
      topics.map(function (topic) {
        return chip(topic, state.tag === topic, 'data-filter="tag" data-value="' + esc(topic) + '"', 0);
      }).join('');
    const statusChips = chip('全部', state.status === '', 'data-filter="status" data-value=""', 0) +
      statuses.map(function (status) {
        return chip(status, state.status === status, 'data-filter="status" data-value="' + esc(status) + '"', 0);
      }).join('');
    app.innerHTML =
      '<section id="papers">' +
        '<div class="filters">' +
          '<div class="filter-row">' +
            '<label class="filter-label" for="q">搜索</label>' +
            '<input id="q" type="search" placeholder="题目、作者、备注、笔记或 reflection" autocomplete="off" spellcheck="false" enterkeyhint="search" value="' + esc(state.q) + '">' +
          '</div>' +
          '<div class="filter-row" role="group" aria-label="课题">' +
            '<span class="filter-label">课题</span>' +
            '<div class="chips">' + topicChips + '</div>' +
          '</div>' +
          '<div class="filter-row" role="group" aria-label="状态">' +
            '<span class="filter-label">状态</span>' +
            '<div class="chips">' + statusChips + '</div>' +
          '</div>' +
          '<div class="filter-row" role="group" aria-label="补充材料">' +
            '<span class="filter-label wide">补充</span>' +
            '<div class="chips">' +
              chip('有精读笔记', state.note, 'data-filter="note"', 0) +
              chip('有 reflection', state.reflect, 'data-filter="reflect"', 0) +
            '</div>' +
          '</div>' +
          '<div class="filter-row">' +
            '<span class="filter-label">排序</span>' +
            '<div class="chips">' +
              '<button type="button" class="chip" data-sort="issue" aria-pressed="' + (state.sort === 'issue' ? 'true' : 'false') + '">按期 · 新到旧</button>' +
              '<button type="button" class="chip" data-sort="year" aria-pressed="' + (state.sort === 'year' ? 'true' : 'false') + '">按年份 · 新到旧</button>' +
            '</div>' +
            '<p class="count" id="count" aria-live="polite"></p>' +
            '<button type="button" class="text-btn" id="clear" hidden>清除筛选</button>' +
          '</div>' +
        '</div>' +
        '<div id="list"></div>' +
      '</section>';

    document.getElementById('q').addEventListener('input', function (event) {
      state.q = event.target.value.trim().toLowerCase();
      renderPaperList();
    });
    document.getElementById('list').addEventListener('toggle', function (event) {
      const details = event.target;
      if (!details || !details.dataset || !details.dataset.id) return;
      if (details.open) state.open.add(details.dataset.id);
      else state.open.delete(details.dataset.id);
    }, true);
    renderPaperList();
  }

  function onPapersClick(event) {
    const chipBtn = event.target.closest('.chip');
    if (chipBtn && chipBtn.dataset.filter === 'reflect') {
      state.reflect = !state.reflect;
      syncPressed();
      renderPaperList();
      return;
    }
    if (chipBtn && chipBtn.dataset.filter === 'note') {
      state.note = !state.note;
      syncPressed();
      renderPaperList();
      return;
    }
    if (chipBtn && chipBtn.dataset.filter) {
      const key = chipBtn.dataset.filter === 'tag' ? 'tag' : 'status';
      state[key] = chipBtn.dataset.value || '';
      syncPressed();
      renderPaperList();
      return;
    }
    if (chipBtn && chipBtn.dataset.sort) {
      state.sort = chipBtn.dataset.sort;
      syncPressed();
      renderPaperList();
      return;
    }
    const tagBtn = event.target.closest('[data-tag]');
    if (tagBtn) {
      state.tag = tagBtn.dataset.tag;
      syncPressed();
      renderPaperList();
      window.scrollTo(0, 0);
      return;
    }
    if (event.target.closest('#clear')) {
      state.tag = '';
      state.status = '';
      state.q = '';
      state.reflect = false;
      state.note = false;
      const input = document.getElementById('q');
      if (input) input.value = '';
      syncPressed();
      renderPaperList();
    }
  }

  function syncPressed() {
    document.querySelectorAll('[data-filter="tag"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String((btn.dataset.value || '') === state.tag));
    });
    document.querySelectorAll('[data-filter="status"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String((btn.dataset.value || '') === state.status));
    });
    document.querySelectorAll('[data-sort]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.sort === state.sort));
    });
    document.querySelectorAll('[data-filter="reflect"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(!!state.reflect));
    });
    document.querySelectorAll('[data-filter="note"]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(!!state.note));
    });
  }

  function renderPaperList() {
    const list = document.getElementById('list');
    const count = document.getElementById('count');
    const clear = document.getElementById('clear');
    if (!list) return;
    const shown = visiblePapers();
    document.querySelectorAll('[data-filter="tag"]').forEach(function (btn) {
      const value = btn.dataset.value || '';
      const n = state.papers.filter(function (paper) {
        return matchPaper(paper, value, state.status);
      }).length;
      const num = btn.querySelector('.n');
      if (num) num.textContent = String(n);
    });
    document.querySelectorAll('[data-filter="status"]').forEach(function (btn) {
      const value = btn.dataset.value || '';
      const n = state.papers.filter(function (paper) {
        return matchPaper(paper, state.tag, value);
      }).length;
      const num = btn.querySelector('.n');
      if (num) num.textContent = String(n);
    });
    if (shown.length === state.papers.length) {
      count.textContent = '共 ' + state.papers.length + ' 篇';
    } else {
      count.textContent = '共 ' + state.papers.length + ' 篇，当前 ' + shown.length + ' 篇';
    }
    document.querySelectorAll('[data-filter="reflect"]').forEach(function (btn) {
      const n = state.papers.filter(function (paper) {
        return matchPaper(paper, state.tag, state.status, false) && paper.hasReflection;
      }).length;
      const num = btn.querySelector('.n');
      if (num) num.textContent = String(n);
    });
    document.querySelectorAll('[data-filter="note"]').forEach(function (btn) {
      const n = state.papers.filter(function (paper) {
        return matchPaper(paper, state.tag, state.status, undefined, false) && paper.hasNotes;
      }).length;
      const num = btn.querySelector('.n');
      if (num) num.textContent = String(n);
    });
    clear.hidden = !(state.tag || state.status || state.q || state.reflect || state.note);
    if (!shown.length) {
      let emptyText = '没有符合的文献。换个词，或把课题和状态改回「全部」。';
      if (!state.tag && !state.status && !state.q && state.note && !state.reflect) emptyText = '还没有精读笔记。';
      else if (!state.tag && !state.status && !state.q && state.reflect && !state.note) emptyText = '还没有 reflection。';
      list.innerHTML = '<p class="empty">' + emptyText + '</p>';
      return;
    }
    list.innerHTML = shown.map(paperCard).join('');
  }

  function renderIssueList() {
    const issues = state.issues.slice().sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    });
    const cards = issues.map(function (issue) {
      const label = issue.issueNo ? '第 ' + issue.issueNo + ' 期' : '摘要';
      const concl = issue.conclusion
        ? '<p class="concl">' + esc(issue.conclusion) + '</p>'
        : '';
      return (
        '<li>' +
          '<a class="issue-card" href="#/issues/' + esc(issue.date) + '">' +
            '<div class="issue-card-top">' +
              '<time datetime="' + esc(issue.date) + '">' + esc(issue.date) + '</time>' +
              '<span class="issue-no">' + esc(label) + '</span>' +
              '<span class="issue-count">' + issue.notes.length + ' 篇</span>' +
            '</div>' +
            concl +
          '</a>' +
        '</li>'
      );
    }).join('');
    app.innerHTML =
      '<section id="issues">' +
        '<h2 class="view-title">各期摘要</h2>' +
        '<p class="view-lead">按日期排列。点进去是那一期的全文。</p>' +
        '<ul class="issue-list">' + cards + '</ul>' +
      '</section>';
  }

  function renderIssue(date) {
    const issue = state.issues.filter(function (item) { return item.date === date; })[0];
    if (!issue) {
      app.innerHTML =
        '<section id="issue">' +
          '<p class="back"><a href="#/issues">返回各期</a></p>' +
          '<p class="empty">没有这一期（' + esc(date) + '）。</p>' +
        '</section>';
      return;
    }
    app.innerHTML =
      '<section id="issue">' +
        '<p class="back"><a href="#/issues">返回各期</a></p>' +
        '<article class="markdown">' + renderMarkdown(issue.md) + '</article>' +
      '</section>';
  }

  function renderRoute() {
    if (!state.ready) return;
    const next = parseHash();
    const prev = state.route;
    const changed = !prev || prev.name !== next.name || prev.date !== next.date;
    state.route = next;
    const nav = next.name === 'papers' ? 'papers' : 'issues';
    setCurrentNav(nav);
    if (next.name === 'papers') {
      document.title = '调研材料';
      renderPapersShell();
    } else if (next.name === 'issues') {
      document.title = '调研材料 · 各期摘要';
      renderIssueList();
    } else {
      document.title = '调研材料 · ' + next.date;
      renderIssue(next.date);
    }
    if (changed) window.scrollTo(0, 0);
  }

  function attachNotes(papers, issues) {
    const byDoi = new Map();
    issues.forEach(function (issue) {
      issue.notes.forEach(function (note) {
        const prev = byDoi.get(note.doi);
        if (!prev || prev.date < issue.date) {
          byDoi.set(note.doi, {
            did: note.did,
            relation: note.relation,
            date: issue.date
          });
        }
      });
    });
    papers.forEach(function (paper) {
      const hit = byDoi.get(paper.doi);
      paper.did = hit ? hit.did : '';
      paper.relation = hit ? hit.relation : '';
      paper.issueDate = hit ? hit.date : '';
    });
  }

  function load() {
    app.innerHTML = '<p class="loading">正在读取文献…</p>';
    return fetchText('data/digest-index.md').then(function (indexMd) {
      return fetchText('data/briefs/index.json').then(function (manifestText) {
        let manifest;
        try {
          manifest = JSON.parse(manifestText);
        } catch (err) {
          throw new Error('data/briefs/index.json 不是合法的 JSON。');
        }
        if (!Array.isArray(manifest)) throw new Error('data/briefs/index.json 应该是一个列表。');
        const jobs = manifest.map(function (item) {
          if (!item || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !/^[A-Za-z0-9._-]+$/.test(item.file)) {
            throw new Error('index.json 里有一行格式不对。需要 date（YYYY-MM-DD）和 file。');
          }
          return fetchText('data/briefs/' + item.file).then(function (md) {
            const meta = DigestParse.parseIssueMeta(md);
            return {
              date: item.date,
              file: item.file,
              md: md,
              h1: meta.h1,
              issueNo: meta.issueNo,
              conclusion: meta.conclusion,
              notes: DigestParse.parseBrief(md)
            };
          });
        });
        return Promise.all(jobs).then(function (issues) {
          const papers = DigestParse.parseIndex(indexMd);
          attachNotes(papers, issues);
          papers.forEach(function (paper) {
            paper.slug = DigestParse.doiSlug(paper.doi);
            paper.reflection = '';
            paper.hasReflection = false;
            paper.reflectionPending = false;
            paper.notes = '';
            paper.hasNotes = false;
            paper.notesPending = false;
          });
          return Promise.all([
            loadSideFiles(papers, 'reflections', function (paper, text, pending) {
              paper.hasReflection = true;
              paper.reflectionPending = pending;
              paper.reflection = pending ? '' : text;
            }),
            loadSideFiles(papers, 'notes', function (paper, text, pending) {
              paper.hasNotes = true;
              paper.notesPending = pending;
              paper.notes = pending ? '' : DigestParse.stripFrontmatter(text);
            })
          ]).then(function () {
            state.papers = papers;
            state.issues = issues;
            state.ready = true;
            renderRoute();
          });
        });
      });
    }).catch(function (err) {
      showError('没有读到数据。' + (err && err.message ? err.message : '请用静态服务器打开这个目录。'));
    });
  }

  function fetchFolderNames(folder) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, 4000);
    return fetch('https://api.github.com/repos/' + GITHUB_REPO + '/contents/data/' + folder + '?ref=main', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store',
      signal: ctrl.signal
    }).then(function (res) {
      clearTimeout(timer);
      if (res.status === 404) return [];
      if (!res.ok) return null;
      return res.json().then(function (items) {
        if (!Array.isArray(items)) return null;
        return items.filter(function (item) {
          return item && item.type === 'file' && typeof item.name === 'string' && /\.md$/i.test(item.name);
        }).map(function (item) {
          return item.name.replace(/\.md$/i, '');
        });
      }).catch(function () { return null; });
    }).catch(function () {
      clearTimeout(timer);
      return null;
    });
  }

  function loadSideFiles(papers, folder, apply) {
    return fetchFolderNames(folder).then(function (names) {
      return Promise.all(papers.map(function (paper) {
        if (!paper.slug) return Promise.resolve();
        const listed = !!(names && names.indexOf(paper.slug) !== -1);
        if (names && !listed) return Promise.resolve();
        return fetch('data/' + folder + '/' + paper.slug + '.md', { cache: 'no-cache' }).then(function (res) {
          if (!res.ok) {
            if (listed) apply(paper, '', true);
            return;
          }
          return res.text().then(function (text) { apply(paper, text, false); });
        }).catch(function () {
          if (listed) apply(paper, '', true);
        });
      }));
    });
  }

  app.addEventListener('click', onPapersClick);
  window.addEventListener('hashchange', renderRoute);
  load();
})();
