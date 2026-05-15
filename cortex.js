(function () {
  'use strict';

  var STORAGE_KEY = 'bpPdCortex.v1';
  var ADMIN_MODE_KEY = 'bpPdCortex.adminMode';

  var LANE_ORDER = ['central', 'bpd', 'opmech', 'financial'];
  var LANE_LABELS = {
    central: '🏛 Central Planning Calendar',
    bpd: '📋 BP PD Internal Deliverables',
    opmech: '📅 BP PD Op Mechs & Meetings',
    financial: '💰 Financial Planning'
  };

  var COLOR_CLASS = {
    blue: 'd-blue',
    teal: 'd-teal',
    green: 'd-green',
    orange: 'd-orange',
    purple: 'd-purple',
    red: 'd-red',
    gray: 'd-gray',
    yellow: 'd-yellow',
    pink: 'd-pink'
  };

  var BAR_CLASS = {
    blue: 'c-blue',
    teal: 'c-teal',
    green: 'c-green',
    orange: 'c-orange',
    purple: 'c-purple',
    red: 'c-red',
    gray: 'c-gray',
    yellow: 'c-yellow',
    pink: 'c-pink'
  };

  var AVATAR_COLORS = ['#e67e22', '#2563eb', '#16a34a', '#7c3aed', '#0891b2', '#db2777', '#dc2626'];

  /** Used when data/seed.json cannot be fetched (e.g. file://). Full seed lives in data/seed.json for GitHub Pages. */
  var EMBEDDED_SEED = {
    viewer: { displayName: 'Guest' },
    links: {
      sbgPlanningCortex:
        'https://intuitcorp.quickbase.com/db/bvmumchzn?a=dbpage&pagename=planning-navigator.html'
    },
    admins: [
      { name: 'Judy Nannini', email: 'judy_nannini@intuit.com', role: 'VP BP PD' },
      { name: 'Omar Elkabti', email: 'omar_elkabti@intuit.com', role: 'TPM Lead' }
    ],
    announcements: [
      {
        id: 'ann-fallback-1',
        text: 'Configure data/seed.json and serve over http(s) for the full demo dataset.',
        postedBy: 'Planning Cortex',
        postedDate: '2026-01-01',
        expiryDate: '',
        isActive: true
      }
    ],
    milestones: [
      {
        id: 'ms-fb-1',
        title: 'Example milestone (embedded seed)',
        lane: 'bpd',
        startDate: '2026-05-20',
        endDate: '2026-05-20',
        color: 'orange',
        shape: 'dot',
        displayLabel: '5/20',
        isActive: true
      }
    ]
  };

  var state = {
    viewer: { displayName: 'Guest' },
    links: {},
    admins: [],
    announcements: [],
    milestones: [],
    scale: 'week',
    laneFilter: 'all',
    adminMode: false,
    seedVersion: 1
  };

  var adminModalDraft = null;
  var pendingMilestonePreset = null;

  function $(id) {
    return document.getElementById(id);
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) {
        return w[0];
      })
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseISODate(s) {
    var p = String(s || '').split('-');
    if (p.length !== 3) return null;
    var y = parseInt(p[0], 10);
    var m = parseInt(p[1], 10) - 1;
    var day = parseInt(p[2], 10);
    if (!y || m < 0 || m > 11 || !day) return null;
    var d = new Date(y, m, day);
    if (d.getFullYear() !== y || d.getMonth() !== m || d.getDate() !== day) return null;
    return d;
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  function mondayOfWeekContaining(d) {
    var s = startOfDay(d);
    var dow = s.getDay();
    var delta = dow === 0 ? -6 : 1 - dow;
    return addDays(s, delta);
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }

  function addMonths(d, n) {
    return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
  }

  function formatShortRange(a, b) {
    var mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (sameMonth) {
      return mo[a.getMonth()] + ' ' + a.getDate() + '–' + b.getDate();
    }
    return mo[a.getMonth()] + ' ' + a.getDate() + ' – ' + mo[b.getMonth()] + ' ' + b.getDate();
  }

  function formatMonthYear(d) {
    var mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return mo[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatWeekdayDate(d) {
    var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return days[d.getDay()] + ', ' + mo[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function today() {
    return startOfDay(new Date());
  }

  function uid(prefix) {
    return prefix + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function deepClone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function buildTimeline(scale, anchor) {
    var periods = [];
    var rangeStart;
    var rangeEnd;
    var t0 = startOfDay(anchor);

    if (scale === 'day') {
      rangeStart = addDays(t0, -7);
      for (var i = 0; i < 21; i++) {
        var s = addDays(rangeStart, i);
        var e = s;
        periods.push({
          start: s,
          end: e,
          label: String(s.getMonth() + 1) + '/' + s.getDate()
        });
      }
      rangeEnd = endOfDay(periods[periods.length - 1].end);
    } else if (scale === 'month') {
      var m0 = startOfMonth(addMonths(t0, -3));
      rangeStart = m0;
      for (var j = 0; j < 8; j++) {
        var ms = addMonths(m0, j);
        var me = endOfMonth(ms);
        periods.push({
          start: startOfDay(ms),
          end: endOfDay(me),
          label: formatMonthYear(ms)
        });
      }
      rangeEnd = endOfDay(periods[periods.length - 1].end);
    } else {
      var w0 = mondayOfWeekContaining(addDays(t0, -42));
      rangeStart = w0;
      for (var k = 0; k < 14; k++) {
        var ws = addDays(w0, k * 7);
        var we = addDays(ws, 6);
        periods.push({
          start: ws,
          end: we,
          label: formatShortRange(ws, we)
        });
      }
      rangeEnd = endOfDay(periods[periods.length - 1].end);
    }

    return { periods: periods, rangeStart: rangeStart, rangeEnd: rangeEnd };
  }

  function endOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  function periodContainsToday(p, t) {
    return t >= p.start && t <= p.end;
  }

  function mergeSeedIntoState(seed) {
    state.viewer = seed.viewer || state.viewer;
    state.links = seed.links || state.links;
    state.admins = seed.admins || [];
    state.announcements = seed.announcements || [];
    state.milestones = seed.milestones || [];
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveLocal() {
    var payload = {
      viewer: state.viewer,
      links: state.links,
      admins: state.admins,
      announcements: state.announcements,
      milestones: state.milestones,
      seedVersion: state.seedVersion
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadAdminMode() {
    try {
      return localStorage.getItem(ADMIN_MODE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function saveAdminMode() {
    try {
      localStorage.setItem(ADMIN_MODE_KEY, state.adminMode ? '1' : '0');
    } catch (e) {
      /* ignore */
    }
  }

  function showToast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      el.classList.add('hidden');
    }, 2800);
  }

  function setAdminMode(on) {
    state.adminMode = !!on;
    document.body.classList.toggle('admin-mode', state.adminMode);
    var btn = $('btn-admin-mode');
    btn.textContent = state.adminMode ? 'Edit mode: On' : 'Edit mode: Off';
    saveAdminMode();
    renderChrome();
  }

  function openModal(id) {
    var m = $(id);
    m.classList.remove('hidden');
    m.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    var m = $(id);
    m.classList.add('hidden');
    m.setAttribute('aria-hidden', 'true');
  }

  function isCentralLane(lane) {
    return lane === 'central';
  }

  function filteredMilestones() {
    return state.milestones.filter(function (ms) {
      if (!ms.isActive) return false;
      if (state.laneFilter === 'all') return true;
      return ms.lane === state.laneFilter;
    });
  }

  function exportCsv() {
    if (!state.adminMode) {
      showToast('Turn on edit mode to export CSV.');
      return;
    }
    var rows = [['id', 'title', 'lane', 'startDate', 'endDate', 'color', 'shape', 'displayLabel', 'isActive']];
    filteredMilestones().forEach(function (m) {
      rows.push([
        m.id,
        csvEscape(m.title),
        m.lane,
        m.startDate,
        m.endDate,
        m.color,
        m.shape,
        csvEscape(m.displayLabel || ''),
        m.isActive ? 'true' : 'false'
      ]);
    });
    var blob = new Blob([rows.map(function (r) { return r.join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bp-pd-milestones-' + toISODate(today()) + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    showToast('CSV downloaded.');
  }

  function csvEscape(s) {
    var t = String(s == null ? '' : s);
    if (/[",\n]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
    return t;
  }

  function renderTopBar() {
    $('topbar-date').textContent = formatWeekdayDate(new Date());
    var name = state.viewer.displayName || 'Guest';
    var extra = state.adminMode
      ? '<span style="color:#7ec8e3">Edit mode on</span> — changes save in this browser.'
      : 'Read-only view. Turn on <strong>Edit mode</strong> to change milestones and announcements.';
    $('topbar-welcome').innerHTML = '•&nbsp;&nbsp;Welcome back, ' + escapeHtml(name) + '! ' + extra;
    $('viewer-avatar').textContent = initials(name) || '—';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAnnouncements() {
    var host = $('announcement-list');
    var items = state.announcements.filter(function (a) {
      if (!a.isActive) return false;
      if (!a.expiryDate) return true;
      var exp = parseISODate(a.expiryDate);
      return !exp || exp >= today();
    });
    host.innerHTML = items
      .map(function (a) {
        return (
          '<div class="ann-item" data-announce-id="' +
          escapeHtml(a.id) +
          '">' +
          '<strong>' +
          escapeHtml(shortLead(a.text)) +
          '</strong> — ' +
          escapeHtml(restOfText(a.text, shortLead(a.text))) +
          '</div>'
        );
      })
      .join('');
    host.querySelectorAll('.ann-item').forEach(function (el) {
      el.addEventListener('dblclick', function () {
        if (!state.adminMode) return;
        var id = el.getAttribute('data-announce-id');
        openAnnounceModal(id);
      });
    });
  }

  function shortLead(text) {
    var t = String(text || '');
    var m = t.match(/^([^—\n]{1,40})/);
    return m ? m[1].trim() : t.slice(0, 40).trim();
  }

  function restOfText(text, lead) {
    var t = String(text || '');
    if (t.indexOf(lead) === 0) return t.slice(lead.length).replace(/^[—\s]+/, '');
    return t;
  }

  function renderAdminSidebar() {
    var el = $('admin-list');
    el.innerHTML = state.admins
      .map(function (a, i) {
        var bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          '<div class="admin-chip">' +
          '<div class="admin-chip-avatar" style="background:' +
          bg +
          '">' +
          initials(a.name) +
          '</div>' +
          '<div class="admin-chip-meta">' +
          '<div class="admin-chip-name">' +
          escapeHtml(a.name) +
          '</div>' +
          (a.role ? '<div class="admin-chip-role">' + escapeHtml(a.role) + '</div>' : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderSidebarLinks() {
    var defs = [
      {
        id: 'dependencyDashboard',
        icon: '📊',
        label: 'Dependency Dashboard',
        sub: 'Live IB/OB tracker',
        group: 'artifacts'
      },
      {
        id: 'workstreamReconciliation',
        icon: '🔄',
        label: 'Workstream Reconciliation',
        sub: 'Cap ↔ SBG × Input Goals',
        group: 'artifacts'
      },
      {
        id: 'capabilityRoadmap',
        icon: '🗺',
        label: '6Q Capability Roadmap',
        sub: 'Business Platform PD',
        group: 'artifacts'
      },
      {
        id: 'sbgPortfolioRoadmap',
        icon: '📋',
        label: 'SBG Portfolio Roadmap',
        sub: 'Product Work Roadmap',
        group: 'artifacts'
      },
      {
        id: 'fy27InputGoals',
        icon: '🎯',
        label: 'FY27 Input Goals',
        sub: 'GBSG Pass 3 (latest)',
        group: 'artifacts'
      },
      {
        id: 'bpPdDriveFolder',
        icon: '📁',
        label: 'BP PD Drive Folder',
        sub: 'Planning docs & decks',
        group: 'artifacts'
      },
      {
        id: 'sbgPlanningCortex',
        icon: '⚡',
        label: 'SBG Planning Cortex',
        sub: 'Central calendar',
        group: 'quick'
      },
      {
        id: 'petResourceTracker',
        icon: '📊',
        label: 'PET / Resource Tracker',
        sub: 'Headcount & allocation',
        group: 'quick'
      },
      {
        id: 'smartsheetBpPd',
        icon: '🏗',
        label: 'Smartsheet: BP PD',
        sub: 'Workstreams & deps',
        group: 'quick'
      }
    ];

    function row(d) {
      var url = (state.links && state.links[d.id]) || '';
      var isConfigured = /^https?:\/\//i.test(url);
      var inner =
        '<span class="icon">' +
        d.icon +
        '</span>' +
        '<div><div class="label">' +
        escapeHtml(d.label) +
        '<div class="sublabel">' +
        escapeHtml(d.sub) +
        (isConfigured ? '' : ' · URL not set') +
        '</div></div></div>';
      if (isConfigured) {
        return (
          '<a class="artifact-link" href="' +
          escapeHtml(url) +
          '" target="_blank" rel="noopener noreferrer">' +
          inner +
          '</a>'
        );
      }
      return (
        '<button type="button" class="artifact-link" data-link-miss="' +
        escapeHtml(d.id) +
        '">' +
        inner +
        '</button>'
      );
    }

    $('sidebar-artifacts').innerHTML = defs.filter(function (d) { return d.group === 'artifacts'; }).map(row).join('');
    $('sidebar-quicklinks').innerHTML = defs.filter(function (d) { return d.group === 'quick'; }).map(row).join('');

    document.querySelectorAll('button.artifact-link[data-link-miss]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showToast('URL not configured — edit data/seed.json or clear localStorage and reload.');
      });
    });
  }

  function renderScaleButtons() {
    document.querySelectorAll('#scale-toggle .scale-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-scale') === state.scale);
    });
    document.querySelectorAll('#lane-toggle .scale-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lane') === state.laneFilter);
    });
  }

  function renderGantt() {
    var tl = buildTimeline(state.scale, today());
    var periods = tl.periods;
    var rangeStart = tl.rangeStart;
    var rangeEnd = tl.rangeEnd;
    var tDay = today();

    var headerRow = $('gantt-header-row');
    headerRow.innerHTML =
      '<th class="lane-label-th">PHASE / MILESTONE</th>' +
      periods
        .map(function (p, idx) {
          var cls = periodContainsToday(p, tDay) ? ' today-col today-marker' : '';
          return '<th class="' + cls.trim() + '">' + escapeHtml(p.label) + '</th>';
        })
        .join('');

    var body = $('gantt-body');
    body.innerHTML = '';

    var totalMs = rangeEnd - rangeStart;
    if (totalMs <= 0) totalMs = 1;

    function todayPct() {
      var now = today();
      var x = (now - rangeStart) / totalMs;
      return Math.max(0, Math.min(100, x * 100));
    }

    LANE_ORDER.forEach(function (laneKey) {
      if (state.laneFilter !== 'all' && state.laneFilter !== laneKey) return;

      var trh = document.createElement('tr');
      trh.className = 'lane-header';
      var tdl = document.createElement('td');
      tdl.textContent = LANE_LABELS[laneKey];
      tdl.colSpan = periods.length + 1;
      trh.appendChild(tdl);
      body.appendChild(trh);

      var list = filteredMilestones().filter(function (m) {
        return m.lane === laneKey;
      });
      list.sort(function (a, b) {
        return String(a.startDate).localeCompare(String(b.startDate));
      });

      list.forEach(function (m) {
        var tr = document.createElement('tr');
        tr.className = 'milestone-row';
        tr.setAttribute('data-milestone-id', m.id);
        tr.setAttribute('data-lane', laneKey);

        var tdLabel = document.createElement('td');
        tdLabel.className = 'label-cell';
        tdLabel.textContent = m.title;
        tdLabel.title = m.title;
        tr.appendChild(tdLabel);

        var tdTime = document.createElement('td');
        tdTime.className = 'timeline-cell';
        tdTime.colSpan = periods.length;
        tdTime.dataset.lane = laneKey;

        var inner = document.createElement('div');
        inner.className = 'timeline-inner';

        var grid = document.createElement('div');
        grid.className = 'timeline-grid';
        grid.style.background =
          'repeating-linear-gradient(90deg, #f0f2f8 0, #f0f2f8 1px, transparent 1px, transparent ' +
          (100 / periods.length) +
          '%)';

        var todayLine = document.createElement('div');
        todayLine.className = 'timeline-today';
        todayLine.style.left = todayPct() + '%';

        var wrap = document.createElement('div');
        wrap.className = 'bar-wrap';

        var msStart = parseISODate(m.startDate);
        var msEnd = parseISODate(m.endDate) || msStart;
        if (!msStart) msStart = today();
        if (!msEnd) msEnd = msStart;

        var startMs = startOfDay(msStart).getTime();
        var endMs = endOfDay(msEnd).getTime();

        var overlapStart = Math.max(rangeStart.getTime(), startMs);
        var overlapEnd = Math.min(rangeEnd.getTime(), endMs);
        if (overlapStart <= overlapEnd) {
          var left = ((overlapStart - rangeStart.getTime()) / totalMs) * 100;
          var width = ((overlapEnd - overlapStart) / totalMs) * 100;

          var colorKey = m.color || 'blue';
          var shape = m.shape || 'dot';

          if (shape === 'bar') {
            var bar = document.createElement('div');
            bar.className = 'gantt-bar ' + (BAR_CLASS[colorKey] || 'c-blue');
            bar.style.left = left + '%';
            bar.style.width = Math.max(width, 0.6) + '%';
            bar.textContent = m.displayLabel || m.title || '';
            wrap.appendChild(bar);
          } else if (shape === 'square') {
            var sqLeft = ((startMs - rangeStart.getTime()) / totalMs) * 100;
            sqLeft = Math.max(0, Math.min(100, sqLeft));
            var sq = document.createElement('div');
            sq.className = 'gantt-square ' + (COLOR_CLASS[colorKey] || 'd-red');
            sq.style.left = 'calc(' + sqLeft + '% - 6px)';
            wrap.appendChild(sq);
            if (m.displayLabel) {
              var lf = document.createElement('span');
              lf.className = 'gantt-label-float';
              lf.style.left = 'calc(' + sqLeft + '% + 10px)';
              lf.textContent = m.displayLabel;
              wrap.appendChild(lf);
            }
          } else {
            var mid = startOfDay(msStart);
            mid.setHours(12, 0, 0, 0);
            var dotLeft = ((mid - rangeStart) / totalMs) * 100;
            dotLeft = Math.max(0, Math.min(100, dotLeft));
            var dot = document.createElement('div');
            dot.className = 'gantt-dot ' + (COLOR_CLASS[colorKey] || 'd-blue');
            dot.style.left = 'calc(' + dotLeft + '% - 5px)';
            wrap.appendChild(dot);
            if (m.displayLabel) {
              var lbl = document.createElement('span');
              lbl.className = 'gantt-label-float';
              lbl.style.left = 'calc(' + dotLeft + '% + 10px)';
              lbl.textContent = m.displayLabel;
              wrap.appendChild(lbl);
            }
          }
        }

        inner.appendChild(grid);
        inner.appendChild(todayLine);
        inner.appendChild(wrap);
        tdTime.appendChild(inner);
        tr.appendChild(tdTime);
        body.appendChild(tr);

        function openMs() {
          openMilestoneModal(m.id);
        }
        tdLabel.addEventListener('dblclick', openMs);
        wrap.addEventListener('dblclick', openMs);

        tdTime.addEventListener('dblclick', function (ev) {
          if (!state.adminMode) return;
          if (isCentralLane(laneKey)) {
            showToast('Central lane is read-only (synced conceptually from SBG).');
            return;
          }
          if (ev.target.closest('.gantt-bar, .gantt-dot, .gantt-square, .gantt-label-float')) return;
          var rect = inner.getBoundingClientRect();
          var x = ev.clientX - rect.left;
          var pct = rect.width > 0 ? x / rect.width : 0;
          var ms = rangeStart.getTime() + pct * totalMs;
          var d = startOfDay(new Date(ms));
          pendingMilestonePreset = { lane: laneKey, startDate: toISODate(d), endDate: toISODate(d) };
          openMilestoneModal(null);
        });
      });
    });
  }

  function renderChrome() {
    renderTopBar();
    renderAnnouncements();
    renderAdminSidebar();
    renderSidebarLinks();
    renderScaleButtons();
    renderGantt();
  }

  function openAdminModal() {
    adminModalDraft = deepClone(state.admins);
    renderAdminModalList();
    $('new-admin-name').value = '';
    $('new-admin-email').value = '';
    $('new-admin-role').value = '';
    openModal('admin-modal');
  }

  function renderAdminModalList() {
    var list = adminModalDraft || [];
    $('modal-admin-list').innerHTML = list
      .map(function (a, i) {
        var bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
        return (
          '<div class="admin-row">' +
          '<div class="admin-row-avatar" style="background:' +
          bg +
          '">' +
          initials(a.name) +
          '</div>' +
          '<div class="admin-row-meta">' +
          '<div class="admin-row-name">' +
          escapeHtml(a.name) +
          '</div>' +
          '<div class="admin-row-email">' +
          escapeHtml(a.email) +
          (a.role ? ' · ' + escapeHtml(a.role) : '') +
          '</div></div>' +
          '<button type="button" class="btn-row-remove" data-remove-admin="' +
          i +
          '">Remove</button></div>'
        );
      })
      .join('');

    $('modal-admin-list').querySelectorAll('[data-remove-admin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-remove-admin'), 10);
        if (idx >= 0 && adminModalDraft) adminModalDraft.splice(idx, 1);
        renderAdminModalList();
      });
    });
  }

  function closeAdminModal() {
    adminModalDraft = null;
    closeModal('admin-modal');
  }

  function saveAdminModal() {
    if (adminModalDraft) state.admins = deepClone(adminModalDraft);
    saveLocal();
    closeAdminModal();
    renderChrome();
    showToast('Admins saved in this browser.');
  }

  function addAdminFromForm() {
    var name = $('new-admin-name').value.trim();
    var email = $('new-admin-email').value.trim().toLowerCase();
    var role = $('new-admin-role').value.trim();
    if (!name || !email) {
      showToast('Name and email are required.');
      return;
    }
    if (!email.endsWith('@intuit.com')) {
      showToast('Email must end with @intuit.com');
      return;
    }
    if (!adminModalDraft) adminModalDraft = [];
    adminModalDraft.push({ name: name, email: email, role: role });
    $('new-admin-name').value = '';
    $('new-admin-email').value = '';
    $('new-admin-role').value = '';
    renderAdminModalList();
  }

  function resetAnnounceForm() {
    $('announce-edit-id').value = '';
    $('announce-text').value = '';
    $('announce-expiry').value = '';
    $('announce-active').checked = true;
    $('announce-form-title').textContent = 'Add announcement';
    $('announce-cancel-edit').classList.add('hidden');
  }

  function openAnnounceModal(editId) {
    resetAnnounceForm();
    renderAnnounceModalList();
    if (editId) {
      var a = state.announcements.find(function (x) { return x.id === editId; });
      if (a) {
        $('announce-edit-id').value = a.id;
        $('announce-text').value = a.text || '';
        $('announce-expiry').value = a.expiryDate || '';
        $('announce-active').checked = !!a.isActive;
        $('announce-form-title').textContent = 'Edit announcement';
        $('announce-cancel-edit').classList.remove('hidden');
      }
    }
    openModal('announce-modal');
  }

  function renderAnnounceModalList() {
    $('announce-modal-list').innerHTML = state.announcements
      .map(function (a) {
        return (
          '<div class="announce-row">' +
          '<div class="announce-row-meta">' +
          escapeHtml(a.postedBy || '') +
          ' · posted ' +
          escapeHtml(a.postedDate || '') +
          (a.expiryDate ? ' · expires ' + escapeHtml(a.expiryDate) : '') +
          ' · ' +
          (a.isActive ? 'active' : 'inactive') +
          '</div>' +
          '<div class="announce-row-text">' +
          escapeHtml(a.text) +
          '</div></div>'
        );
      })
      .join('');
  }

  function saveAnnouncement() {
    var text = $('announce-text').value.trim();
    if (!text) {
      showToast('Message is required.');
      return;
    }
    var id = $('announce-edit-id').value.trim();
    var exp = $('announce-expiry').value.trim();
    var active = $('announce-active').checked;
    if (id) {
      var ex = state.announcements.find(function (x) { return x.id === id; });
      if (ex) {
        ex.text = text;
        ex.expiryDate = exp;
        ex.isActive = active;
      }
    } else {
      state.announcements.push({
        id: uid('ann'),
        text: text,
        postedBy: state.viewer.displayName || 'Editor',
        postedDate: toISODate(today()),
        expiryDate: exp,
        isActive: active
      });
    }
    saveLocal();
    resetAnnounceForm();
    renderAnnounceModalList();
    renderChrome();
    showToast('Announcement saved.');
  }

  function fillMilestoneSelects() {
    var laneSel = $('milestone-lane');
    laneSel.innerHTML = LANE_ORDER.map(function (k) {
      return '<option value="' + k + '">' + escapeHtml(LANE_LABELS[k]) + '</option>';
    }).join('');

    var colorSel = $('milestone-color');
    colorSel.innerHTML = Object.keys(COLOR_CLASS)
      .map(function (c) {
        return '<option value="' + c + '">' + c + '</option>';
      })
      .join('');
  }

  function openMilestoneModal(id) {
    if (!id && !state.adminMode) {
      showToast('Turn on edit mode to add milestones.');
      return;
    }
    fillMilestoneSelects();
    var readOnlyCentral = false;
    var ms = id ? state.milestones.find(function (m) { return m.id === id; }) : null;

    if (ms && isCentralLane(ms.lane)) readOnlyCentral = true;
    if (!state.adminMode) readOnlyCentral = true;

    $('milestone-id').value = ms ? ms.id : '';
    $('milestone-modal-title').textContent = ms ? 'Edit milestone' : 'New milestone';
    $('milestone-modal-subtitle').textContent = readOnlyCentral
      ? 'Central Planning items are read-only in this demo (conceptually synced from SBG).'
      : state.adminMode
        ? 'Changes apply to this browser only.'
        : 'Turn on edit mode to make changes.';

    var preset = pendingMilestonePreset;
    pendingMilestonePreset = null;

    if (ms) {
      $('milestone-title').value = ms.title || '';
      $('milestone-lane').value = ms.lane;
      $('milestone-color').value = ms.color || 'blue';
      $('milestone-start').value = ms.startDate || '';
      $('milestone-end').value = ms.endDate || ms.startDate || '';
      $('milestone-shape').value = ms.shape || 'dot';
      $('milestone-label').value = ms.displayLabel || '';
      $('milestone-active').checked = !!ms.isActive;
    } else {
      var defLane = preset && preset.lane ? preset.lane : 'bpd';
      if (isCentralLane(defLane)) defLane = 'bpd';
      var sd = preset && preset.startDate ? preset.startDate : toISODate(today());
      var ed = preset && preset.endDate ? preset.endDate : sd;
      $('milestone-title').value = '';
      $('milestone-lane').value = defLane;
      $('milestone-color').value = 'blue';
      $('milestone-start').value = sd;
      $('milestone-end').value = ed;
      $('milestone-shape').value = 'dot';
      $('milestone-label').value = '';
      $('milestone-active').checked = true;
    }

    var ro = readOnlyCentral || !state.adminMode;
    ['milestone-title', 'milestone-lane', 'milestone-color', 'milestone-start', 'milestone-end', 'milestone-shape', 'milestone-label', 'milestone-active'].forEach(function (fid) {
      $(fid).disabled = ro;
    });
    $('milestone-save').classList.toggle('hidden', ro);
    $('milestone-delete').classList.toggle('hidden', ro || !ms);
    openModal('milestone-modal');
  }

  function saveMilestone() {
    if (!state.adminMode) return;
    var id = $('milestone-id').value.trim();
    var title = $('milestone-title').value.trim();
    var lane = $('milestone-lane').value;
    if (!title) {
      showToast('Title is required.');
      return;
    }
    if (isCentralLane(lane)) {
      showToast('Cannot save into Central lane from this editor.');
      return;
    }
    var payload = {
      id: id || uid('ms'),
      title: title,
      lane: lane,
      color: $('milestone-color').value,
      startDate: $('milestone-start').value,
      endDate: $('milestone-end').value || $('milestone-start').value,
      shape: $('milestone-shape').value,
      displayLabel: $('milestone-label').value.trim(),
      isActive: $('milestone-active').checked
    };
    if (!payload.startDate) {
      showToast('Start date is required.');
      return;
    }
    var idx = state.milestones.findIndex(function (m) { return m.id === payload.id; });
    if (idx >= 0) state.milestones[idx] = payload;
    else state.milestones.push(payload);
    saveLocal();
    closeModal('milestone-modal');
    renderChrome();
    showToast('Milestone saved.');
  }

  function deleteMilestone() {
    if (!state.adminMode) return;
    var id = $('milestone-id').value.trim();
    if (!id) return;
    var ms = state.milestones.find(function (m) { return m.id === id; });
    if (ms && isCentralLane(ms.lane)) {
      showToast('Cannot delete Central lane milestones here.');
      return;
    }
    state.milestones = state.milestones.filter(function (m) { return m.id !== id; });
    saveLocal();
    closeModal('milestone-modal');
    renderChrome();
    showToast('Milestone removed.');
  }

  function wireEvents() {
    $('btn-admin-mode').addEventListener('click', function () {
      setAdminMode(!state.adminMode);
    });
    $('btn-admin-panel').addEventListener('click', function () {
      openAdminModal();
    });
    $('btn-manage-admins').addEventListener('click', function () {
      openAdminModal();
    });
    $('btn-announce').addEventListener('click', function () {
      openAnnounceModal(null);
    });
    $('btn-milestone').addEventListener('click', function () {
      pendingMilestonePreset = null;
      openMilestoneModal(null);
    });
    $('btn-export').addEventListener('click', exportCsv);
    $('btn-reset').addEventListener('click', function () {
      if (!confirm('Reset all milestones, announcements, and admins to the built-in seed for this site?')) return;
      resetToSeedEmbedded();
    });

    $('admin-modal-close').addEventListener('click', closeAdminModal);
    $('admin-modal-cancel').addEventListener('click', closeAdminModal);
    $('admin-modal-save').addEventListener('click', saveAdminModal);
    $('btn-add-admin').addEventListener('click', addAdminFromForm);

    $('announce-modal-close').addEventListener('click', function () {
      closeModal('announce-modal');
    });
    $('announce-modal-done').addEventListener('click', function () {
      closeModal('announce-modal');
    });
    $('announce-save').addEventListener('click', saveAnnouncement);
    $('announce-cancel-edit').addEventListener('click', function () {
      resetAnnounceForm();
      renderAnnounceModalList();
    });

    $('milestone-modal-close').addEventListener('click', function () {
      closeModal('milestone-modal');
    });
    $('milestone-cancel').addEventListener('click', function () {
      closeModal('milestone-modal');
    });
    $('milestone-save').addEventListener('click', saveMilestone);
    $('milestone-delete').addEventListener('click', deleteMilestone);

    document.getElementById('scale-toggle').addEventListener('click', function (e) {
      var btn = e.target.closest('.scale-btn');
      if (!btn) return;
      state.scale = btn.getAttribute('data-scale');
      renderChrome();
    });
    document.getElementById('lane-toggle').addEventListener('click', function (e) {
      var btn = e.target.closest('.scale-btn');
      if (!btn) return;
      state.laneFilter = btn.getAttribute('data-lane');
      renderChrome();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAdminModal();
        closeModal('announce-modal');
        closeModal('milestone-modal');
      }
    });
  }

  function resetToSeedEmbedded() {
    fetch('data/seed.json')
      .then(function (r) {
        if (!r.ok) throw new Error('bad status');
        return r.json();
      })
      .then(function (seed) {
        mergeSeedIntoState(seed);
        saveLocal();
        renderChrome();
        showToast('Reset complete.');
      })
      .catch(function () {
        mergeSeedIntoState(deepClone(EMBEDDED_SEED));
        saveLocal();
        renderChrome();
        showToast('Loaded embedded seed (data/seed.json unavailable).');
      });
  }

  async function init() {
    state.adminMode = loadAdminMode();
    document.body.classList.toggle('admin-mode', state.adminMode);

    var seed = null;
    try {
      var res = await fetch('data/seed.json');
      if (res.ok) seed = await res.json();
    } catch (e) {
      seed = null;
    }

    if (!seed) {
      seed = deepClone(EMBEDDED_SEED);
      showToast('Using embedded seed — serve from GitHub Pages or a local server for full data/seed.json.');
    }

    var local = loadLocal();
    if (local && local.admins && local.admins.length) {
      state.viewer = local.viewer || seed.viewer;
      state.links = local.links || seed.links;
      state.admins = local.admins;
      state.announcements = local.announcements && local.announcements.length ? local.announcements : seed.announcements;
      state.milestones = local.milestones && local.milestones.length ? local.milestones : seed.milestones;
    } else {
      mergeSeedIntoState(seed);
      saveLocal();
    }

    var btn = $('btn-admin-mode');
    btn.textContent = state.adminMode ? 'Edit mode: On' : 'Edit mode: Off';

    wireEvents();
    renderChrome();
  }

  init();
})();
