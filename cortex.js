(function () {
  'use strict';

  var STORAGE_KEY = 'bpPdCortex.v1';
  var ADMIN_MODE_KEY = 'bpPdCortex.adminMode';
  var STATUS_KEY = 'bpPdCortex.planStatus.v1';
  var TPM_STATUS_KEY = 'bpPdCortex.tpmStatus.v1';

  var LANE_ORDER = ['central', 'bpd', 'opmech', 'financial'];
  var LANE_LABELS = {
    central: '🏛 Central Planning Calendar',
    bpd: '📋 BP PD Internal Deliverables',
    opmech: '📅 BP PD Op Mechs & Meetings',
    financial: '💰 Financial Planning'
  };

  var COLOR_CLASS = {
    blue: 'd-blue', teal: 'd-teal', green: 'd-green', orange: 'd-orange',
    purple: 'd-purple', red: 'd-red', gray: 'd-gray', yellow: 'd-yellow', pink: 'd-pink'
  };

  var BAR_CLASS = {
    blue: 'c-blue', teal: 'c-teal', green: 'c-green', orange: 'c-orange',
    purple: 'c-purple', red: 'c-red', gray: 'c-gray', yellow: 'c-yellow', pink: 'c-pink'
  };

  var AVATAR_COLORS = ['#e67e22', '#2563eb', '#16a34a', '#7c3aed', '#0891b2', '#db2777', '#dc2626'];

  // ── PD Leaders tab — Kashi Kakarla's direct reports (PD community, excl. EA)
  // Source: Workday org lookup 2026-05-15
  var STATUS_LEADERS = [
    { key: 'nandu',    name: 'Nandu Ramani',      title: 'VP, Core Jobs & Capabilities' },
    { key: 'nhung',    name: 'Nhung Ho',           title: 'VP, AI Science' },
    { key: 'sujay',    name: 'Sujay Sundaram',     title: 'Director, QB INTL & Growth' },
    { key: 'apparna',  name: 'Apparna Ramadoss',   title: 'Director Development' },
    { key: 'tarun',    name: 'Tarun Dhawan',        title: 'Director, Software Engineering' },
    { key: 'varun',    name: 'Varun Gupta',         title: 'Manager 3, Software Engineering' },
    { key: 'alpesh',   name: 'Alpesh Gaglani',      title: 'VP of Technology, Head of Architect' },
    { key: 'allison',  name: 'Allison Bellah',      title: 'Director, TPM (SBG PD)' }
  ];

  var STATUS_DELIVERABLES = [
    { key: 'input-goals',    label: 'Input Goals (Pass 4)',      due: '2026-05-21' },
    { key: 'cto-materials',  label: 'Materials → CTO Cutline',  due: '2026-05-20' },
    { key: 'dep-response',   label: 'Dependency Response',      due: '2026-05-26' },
    { key: 'resourcing',     label: 'Final Resourcing (PET)',    due: '2026-05-26' },
    { key: '3yr-plan',       label: '3&1-Year Plan Materials',   due: '2026-06-02' },
    { key: 'pet-baseline',   label: 'FY27 PET Baseline',         due: '2026-07-03' }
  ];

  // ── TPM tab — Allison Bellah's direct reports
  // Source: Workday org lookup 2026-05-15
  var TPM_MEMBERS = [
    { key: 'allison',  name: 'Allison Bellah',       title: 'Director, TPM (SBG PD)' },
    { key: 'eran',     name: 'Eran Lador',            title: 'Staff TPM – AWS FinOps' },
    { key: 'geetha',   name: 'Geetha Kuppuswamy',     title: 'Manager 3, TPM' },
    { key: 'janine',   name: 'Janine Buellesbach',    title: 'Senior Staff TPM' },
    { key: 'judy',     name: 'Judy Nannini',           title: 'Staff TPM' },
    { key: 'karen',    name: 'Karen Maciolek',         title: 'Manager 3, TPM' },
    { key: 'minar',    name: 'Minar Karia',            title: 'Manager 3, TPM' },
    { key: 'omar',     name: 'Omar Elkabti',           title: 'Principal TPM' }
  ];

  var TPM_ACTIVITIES = [
    { key: 'dep-dashboard',  label: 'Dep Dashboard Updated',    due: '2026-05-20' },
    { key: 'pet-resourcing', label: 'PET Resourcing Confirmed',  due: '2026-05-20' },
    { key: 'cto-packet',     label: 'CTO Packet Assembled',      due: '2026-05-20' },
    { key: 'dep-responses',  label: 'Dep Responses Collected',  due: '2026-05-26' },
    { key: 'roadmap-trueup', label: 'Roadmap True-up Complete',  due: '2026-05-27' },
    { key: '3yr-materials',  label: '3&1-Yr Materials Drafted',  due: '2026-06-02' },
    { key: 'pet-baseline',   label: 'PET Baseline Locked',       due: '2026-07-03' }
  ];

  // Key deadlines shown in the countdown strip
  var KEY_DEADLINES = [
    { label: 'Prelim Resourcing + CTO Materials', date: '2026-05-20', urgencyDays: 5 },
    { label: 'CTO Staff Cutline',                  date: '2026-05-22', urgencyDays: 5 },
    { label: 'Tech Pass 4 IG Submission',          date: '2026-05-21', urgencyDays: 5 },
    { label: 'Final Dependency Response',          date: '2026-05-26', urgencyDays: 8 },
    { label: '3&1-Year Plan Materials Due',        date: '2026-06-02', urgencyDays: 10 },
    { label: 'FY27 PET Baseline Closes',           date: '2026-07-03', urgencyDays: 14 }
  ];

  // Planning phases — where we are in the FY27 cycle
  var PLANNING_PHASES = [
    { label: 'Pass 3 Complete',  start: '2026-04-01', end: '2026-05-10', status: 'done' },
    { label: '⚡ Pass 4 Active', start: '2026-05-11', end: '2026-05-26', status: 'active' },
    { label: '3&1-Yr Plan',      start: '2026-05-27', end: '2026-06-22', status: 'upcoming' },
    { label: 'PET Baseline',     start: '2026-06-08', end: '2026-07-03', status: 'upcoming' },
    { label: 'Plan Lock 6/22',   start: '2026-06-22', end: '2026-06-22', status: 'upcoming' },
    { label: 'Board Meeting',    start: '2026-07-22', end: '2026-07-23', status: 'upcoming' }
  ];

  var EMBEDDED_SEED = {
    viewer: { displayName: 'Guest' },
    links: { sbgPlanningCortex: 'https://intuitcorp.quickbase.com/db/bvmumchzn?a=dbpage&pagename=planning-navigator.html' },
    admins: [
      { name: 'Judy Nannini', email: 'judy_nannini@intuit.com', role: 'Staff Technical Program Manager' },
      { name: 'Omar Elkabti', email: 'omar_elkabti@intuit.com', role: 'Principal Technical Program Manager' }
    ],
    announcements: [{
      id: 'ann-fallback-1',
      text: 'Configure data/seed.json and serve over http(s) for the full demo dataset.',
      postedBy: 'Planning Cortex', postedDate: '2026-01-01', expiryDate: '', isActive: true
    }],
    milestones: [{
      id: 'ms-fb-1', title: 'Example milestone (embedded seed)', lane: 'bpd',
      startDate: '2026-05-20', endDate: '2026-05-20', color: 'orange', shape: 'dot',
      displayLabel: '5/20', isActive: true
    }]
  };

  var state = {
    viewer: { displayName: 'Guest' },
    links: {}, admins: [], announcements: [], milestones: [],
    scale: 'week', laneFilter: 'all', adminMode: false, seedVersion: 1,
    activeTab: 'gantt',
    planStatus: {},   // { 'nandu|input-goals': { status: 'done', note: '' }, ... }
    tpmStatus: {},    // { 'omar|dep-dashboard': { status: 'done', note: '' }, ... }
    backendUrl: ''    // Apps Script web app URL, loaded from seed.json
  };

  var adminModalDraft = null;
  var pendingMilestonePreset = null;
  var cellEditTarget = null; // { leaderKey, deliverableKey }

  function $(id) { return document.getElementById(id); }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function toISODate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }

  function parseISODate(s) {
    var p = String(s || '').split('-');
    if (p.length !== 3) return null;
    var y = parseInt(p[0], 10), m = parseInt(p[1], 10) - 1, day = parseInt(p[2], 10);
    if (!y || m < 0 || m > 11 || !day) return null;
    var d = new Date(y, m, day);
    if (d.getFullYear() !== y || d.getMonth() !== m || d.getDate() !== day) return null;
    return d;
  }

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function endOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }

  function mondayOfWeekContaining(d) {
    var s = startOfDay(d), dow = s.getDay(), delta = dow === 0 ? -6 : 1 - dow;
    return addDays(s, delta);
  }

  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
  function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }

  function formatShortRange(a, b) {
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (sameMonth) return mo[a.getMonth()] + ' ' + a.getDate() + '–' + b.getDate();
    return mo[a.getMonth()] + ' ' + a.getDate() + ' – ' + mo[b.getMonth()] + ' ' + b.getDate();
  }

  function formatMonthYear(d) {
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return mo[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatWeekdayDate(d) {
    var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return days[d.getDay()] + ', ' + mo[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function today() { return startOfDay(new Date()); }

  function daysUntil(isoDate) {
    var d = parseISODate(isoDate);
    if (!d) return null;
    var t = today();
    var diff = Math.round((startOfDay(d) - t) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function uid(prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── Countdown strip ─────────────────────────────────────────────────────────
  function renderDeadlineStrip() {
    var el = $('deadline-strip');
    var items = KEY_DEADLINES.map(function (d) {
      var days = daysUntil(d.date);
      if (days === null || days < -1) return null; // past by more than 1 day
      var urgency = days < 0 ? 'passed' : days === 0 ? 'today' : days <= 3 ? 'critical' : days <= d.urgencyDays ? 'warning' : 'ok';
      var label = days < 0 ? 'PASSED' : days === 0 ? 'TODAY' : days === 1 ? 'TOMORROW' : 'in ' + days + 'd';
      return { d: d, days: days, urgency: urgency, label: label };
    }).filter(Boolean);

    if (!items.length) {
      el.classList.add('hidden');
      return;
    }

    el.classList.remove('hidden');
    el.innerHTML = '<div class="ds-label">⏱ DEADLINES</div>' +
      items.map(function (it) {
        return '<div class="ds-item ds-' + it.urgency + '">' +
          '<span class="ds-badge">' + it.label + '</span>' +
          '<span class="ds-name">' + escapeHtml(it.d.label) + '</span>' +
          '<span class="ds-date">' + escapeHtml(it.d.date.slice(5).replace('-', '/')) + '</span>' +
          '</div>';
      }).join('');
  }

  // ── Phase bar ───────────────────────────────────────────────────────────────
  function renderPhaseBar() {
    var el = $('phase-bar');
    var t = today();
    el.innerHTML = '<div class="pb-label">PLANNING CYCLE:</div>' +
      PLANNING_PHASES.map(function (ph) {
        var s = parseISODate(ph.start), e = parseISODate(ph.end);
        var isCurrent = s && e && t >= s && t <= e;
        var isPast = e && t > e;
        var cls = isCurrent ? 'ph-active' : isPast ? 'ph-done' : 'ph-upcoming';
        return '<div class="pb-phase ' + cls + '">' +
          (isPast ? '✓ ' : isCurrent ? '' : '') +
          escapeHtml(ph.label) +
          '</div>';
      }).join('');
  }

  // ── Planning Status grid ────────────────────────────────────────────────────
  function statusKey(leaderKey, deliverableKey) { return leaderKey + '|' + deliverableKey; }

  function loadPlanStatus() {
    try {
      var raw = localStorage.getItem(STATUS_KEY);
      if (raw) state.planStatus = JSON.parse(raw) || {};
    } catch (e) { state.planStatus = {}; }
    try {
      var raw2 = localStorage.getItem(TPM_STATUS_KEY);
      if (raw2) state.tpmStatus = JSON.parse(raw2) || {};
    } catch (e) { state.tpmStatus = {}; }
  }

  function savePlanStatus() {
    localStorage.setItem(STATUS_KEY, JSON.stringify(state.planStatus));
  }

  function saveTpmStatus() {
    localStorage.setItem(TPM_STATUS_KEY, JSON.stringify(state.tpmStatus));
  }

  // ── Backend sync (Apps Script) ───────────────────────────────────────────
  // Fetches latest status from the Sheet and merges it over localStorage.
  // Sheet data wins — it's the source of truth.
  function loadFromBackend() {
    var url = state.backendUrl;
    if (!url) return;
    fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || data.error) return;
        if (data.planStatus && typeof data.planStatus === 'object') {
          Object.assign(state.planStatus, data.planStatus);
          savePlanStatus();
        }
        if (data.tpmStatus && typeof data.tpmStatus === 'object') {
          Object.assign(state.tpmStatus, data.tpmStatus);
          saveTpmStatus();
        }
        if (state.activeTab === 'status') renderStatusGrid();
        if (state.activeTab === 'tpm') renderTpmGrid();
      })
      .catch(function () { /* backend unavailable — localStorage values stand */ });
  }

  // Fire-and-forget POST for a single cell update.
  // localStorage is already written before this is called, so the UI is instant.
  function syncCellToBackend(grid, rowKey, colKey, status, note) {
    var url = state.backendUrl;
    if (!url) return;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grid: grid,
        rowKey: rowKey,
        colKey: colKey,
        status: status,
        note: note,
        updatedBy: state.viewer.displayName || 'unknown'
      })
    }).catch(function () { /* silent — cell is already saved in localStorage */ });
  }

  function getCellStatus(leaderKey, deliverableKey) {
    return state.planStatus[statusKey(leaderKey, deliverableKey)] || { status: 'pending', note: '' };
  }

  function getTpmCellStatus(memberKey, activityKey) {
    return state.tpmStatus[statusKey(memberKey, activityKey)] || { status: 'pending', note: '' };
  }

  function renderStatusGrid() {
    var grid = $('status-grid');
    if (!grid) return;

    // Build summary counts
    var totalCells = STATUS_LEADERS.length * STATUS_DELIVERABLES.length;
    var doneCells = 0, atRiskCells = 0;
    STATUS_LEADERS.forEach(function (l) {
      STATUS_DELIVERABLES.forEach(function (d) {
        var c = getCellStatus(l.key, d.key);
        if (c.status === 'done') doneCells++;
        if (c.status === 'at-risk') atRiskCells++;
      });
    });
    var pct = Math.round((doneCells / totalCells) * 100);

    var html = '<div class="sg-summary">' +
      '<div class="sg-progress-wrap">' +
      '<div class="sg-progress-bar"><div class="sg-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="sg-progress-label">' + doneCells + ' / ' + totalCells + ' deliverables complete (' + pct + '%)</span>' +
      '</div>' +
      (atRiskCells > 0 ? '<div class="sg-risk-flag">⚠ ' + atRiskCells + ' at risk</div>' : '') +
      '</div>';

    // Header row
    html += '<div class="sg-table-wrap"><table class="sg-table">';
    html += '<thead><tr><th class="sg-leader-th">PD Leader</th>';
    STATUS_DELIVERABLES.forEach(function (d) {
      var days = daysUntil(d.due);
      var dueClass = days !== null && days >= 0 && days <= 5 ? ' sg-due-soon' : '';
      html += '<th class="sg-del-th' + dueClass + '">' +
        escapeHtml(d.label) +
        '<div class="sg-due">Due ' + escapeHtml(d.due.slice(5).replace('-', '/')) + '</div>' +
        '</th>';
    });
    html += '</tr></thead><tbody>';

    STATUS_LEADERS.forEach(function (leader) {
      html += '<tr>';
      html += '<td class="sg-leader-cell">' +
        '<div class="sg-leader-name">' + escapeHtml(leader.name) + '</div>' +
        '<div class="sg-leader-cap">' + escapeHtml(leader.title) + '</div>' +
        '</td>';

      STATUS_DELIVERABLES.forEach(function (del) {
        var cell = getCellStatus(leader.key, del.key);
        var s = cell.status || 'pending';
        var editable = state.adminMode ? ' sg-cell-editable' : '';
        html += '<td class="sg-cell sg-s-' + s + editable + '"' +
          ' data-leader="' + escapeHtml(leader.key) + '"' +
          ' data-del="' + escapeHtml(del.key) + '"' +
          ' title="' + escapeHtml(cell.note || '') + '">' +
          statusIcon(s) +
          (cell.note ? '<span class="sg-cell-note">…</span>' : '') +
          '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    grid.innerHTML = html;

    // Wire click handlers for editable cells
    if (state.adminMode) {
      grid.querySelectorAll('.sg-cell-editable').forEach(function (td) {
        td.addEventListener('click', function () {
          openCellModal(td.getAttribute('data-leader'), td.getAttribute('data-del'), 'pd');
        });
      });
    }
  }

  function renderTpmGrid() {
    var grid = $('tpm-grid');
    if (!grid) return;

    var totalCells = TPM_MEMBERS.length * TPM_ACTIVITIES.length;
    var doneCells = 0, atRiskCells = 0;
    TPM_MEMBERS.forEach(function (m) {
      TPM_ACTIVITIES.forEach(function (a) {
        var c = getTpmCellStatus(m.key, a.key);
        if (c.status === 'done') doneCells++;
        if (c.status === 'at-risk') atRiskCells++;
      });
    });
    var pct = Math.round((doneCells / totalCells) * 100);

    var html = '<div class="sg-summary">' +
      '<div class="sg-progress-wrap">' +
      '<div class="sg-progress-bar"><div class="sg-progress-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="sg-progress-label">' + doneCells + ' / ' + totalCells + ' activities complete (' + pct + '%)</span>' +
      '</div>' +
      (atRiskCells > 0 ? '<div class="sg-risk-flag">⚠ ' + atRiskCells + ' at risk</div>' : '') +
      '</div>';

    html += '<div class="sg-table-wrap"><table class="sg-table">';
    html += '<thead><tr><th class="sg-leader-th">TPM</th>';
    TPM_ACTIVITIES.forEach(function (a) {
      var days = daysUntil(a.due);
      var dueClass = days !== null && days >= 0 && days <= 5 ? ' sg-due-soon' : '';
      html += '<th class="sg-del-th' + dueClass + '">' +
        escapeHtml(a.label) +
        '<div class="sg-due">Due ' + escapeHtml(a.due.slice(5).replace('-', '/')) + '</div>' +
        '</th>';
    });
    html += '</tr></thead><tbody>';

    TPM_MEMBERS.forEach(function (member) {
      html += '<tr>';
      html += '<td class="sg-leader-cell">' +
        '<div class="sg-leader-name">' + escapeHtml(member.name) + '</div>' +
        '<div class="sg-leader-cap">' + escapeHtml(member.title) + '</div>' +
        '</td>';
      TPM_ACTIVITIES.forEach(function (act) {
        var cell = getTpmCellStatus(member.key, act.key);
        var s = cell.status || 'pending';
        var editable = state.adminMode ? ' sg-cell-editable' : '';
        html += '<td class="sg-cell sg-s-' + s + editable + '"' +
          ' data-member="' + escapeHtml(member.key) + '"' +
          ' data-act="' + escapeHtml(act.key) + '"' +
          ' title="' + escapeHtml(cell.note || '') + '">' +
          statusIcon(s) +
          (cell.note ? '<span class="sg-cell-note">…</span>' : '') +
          '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    grid.innerHTML = html;

    if (state.adminMode) {
      grid.querySelectorAll('.sg-cell-editable').forEach(function (td) {
        td.addEventListener('click', function () {
          openCellModal(td.getAttribute('data-member'), td.getAttribute('data-act'), 'tpm');
        });
      });
    }
  }

  function statusIcon(s) {
    if (s === 'done') return '<span class="sg-icon sg-done">✓</span>';
    if (s === 'at-risk') return '<span class="sg-icon sg-at-risk">⚠</span>';
    if (s === 'na') return '<span class="sg-icon sg-na">—</span>';
    return '<span class="sg-icon sg-pending">·</span>';
  }

  function openCellModal(rowKey, colKey, gridType) {
    cellEditTarget = { rowKey: rowKey, colKey: colKey, gridType: gridType || 'pd' };
    var isPd = cellEditTarget.gridType === 'pd';
    var person = isPd
      ? STATUS_LEADERS.find(function (l) { return l.key === rowKey; })
      : TPM_MEMBERS.find(function (m) { return m.key === rowKey; });
    var col = isPd
      ? STATUS_DELIVERABLES.find(function (d) { return d.key === colKey; })
      : TPM_ACTIVITIES.find(function (a) { return a.key === colKey; });
    $('cell-modal-title').textContent = person ? person.name : rowKey;
    $('cell-modal-subtitle').textContent = col ? col.label + ' · due ' + col.due.slice(5).replace('-', '/') : '';
    var cell = isPd ? getCellStatus(rowKey, colKey) : getTpmCellStatus(rowKey, colKey);
    document.querySelectorAll('input[name="cell-status"]').forEach(function (r) {
      r.checked = r.value === (cell.status || 'pending');
    });
    $('cell-note').value = cell.note || '';
    openModal('cell-modal');
  }

  function saveCellModal() {
    if (!cellEditTarget) return;
    var chosen = document.querySelector('input[name="cell-status"]:checked');
    if (!chosen) return;
    var k = statusKey(cellEditTarget.rowKey, cellEditTarget.colKey);
    var noteVal = $('cell-note').value.trim();
    if (cellEditTarget.gridType === 'tpm') {
      state.tpmStatus[k] = { status: chosen.value, note: noteVal };
      saveTpmStatus();
      syncCellToBackend('tpm', cellEditTarget.rowKey, cellEditTarget.colKey, chosen.value, noteVal);
      closeModal('cell-modal');
      renderTpmGrid();
    } else {
      state.planStatus[k] = { status: chosen.value, note: noteVal };
      savePlanStatus();
      syncCellToBackend('plan', cellEditTarget.rowKey, cellEditTarget.colKey, chosen.value, noteVal);
      closeModal('cell-modal');
      renderStatusGrid();
    }
    showToast('Status updated.');
  }

  // ── Tab switching ───────────────────────────────────────────────────────────
  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    $('tab-gantt').classList.toggle('hidden', tab !== 'gantt');
    $('tab-status').classList.toggle('hidden', tab !== 'status');
    $('tab-tpm').classList.toggle('hidden', tab !== 'tpm');
    if (tab === 'status') renderStatusGrid();
    if (tab === 'tpm') renderTpmGrid();
  }

  // ── Timeline ────────────────────────────────────────────────────────────────
  function buildTimeline(scale, anchor) {
    var periods = [], rangeStart, rangeEnd, t0 = startOfDay(anchor);
    if (scale === 'day') {
      rangeStart = addDays(t0, -7);
      for (var i = 0; i < 21; i++) {
        var s = addDays(rangeStart, i);
        periods.push({ start: s, end: s, label: String(s.getMonth() + 1) + '/' + s.getDate() });
      }
      rangeEnd = endOfDay(periods[periods.length - 1].end);
    } else if (scale === 'month') {
      var m0 = startOfMonth(addMonths(t0, -3));
      rangeStart = m0;
      for (var j = 0; j < 8; j++) {
        var ms2 = addMonths(m0, j), me = endOfMonth(ms2);
        periods.push({ start: startOfDay(ms2), end: endOfDay(me), label: formatMonthYear(ms2) });
      }
      rangeEnd = endOfDay(periods[periods.length - 1].end);
    } else {
      var w0 = mondayOfWeekContaining(addDays(t0, -42));
      rangeStart = w0;
      for (var k = 0; k < 14; k++) {
        var ws = addDays(w0, k * 7), we = addDays(ws, 6);
        periods.push({ start: ws, end: we, label: formatShortRange(ws, we) });
      }
      rangeEnd = endOfDay(periods[periods.length - 1].end);
    }
    return { periods: periods, rangeStart: rangeStart, rangeEnd: rangeEnd };
  }

  function periodContainsToday(p, t) { return t >= p.start && t <= p.end; }

  // ── State persistence ───────────────────────────────────────────────────────
  function mergeSeedIntoState(seed) {
    state.viewer = seed.viewer || state.viewer;
    state.links = seed.links || state.links;
    state.admins = seed.admins || [];
    state.announcements = seed.announcements || [];
    state.milestones = seed.milestones || [];
    if (seed.backendUrl) state.backendUrl = seed.backendUrl;
  }

  function loadLocal() {
    try { var raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
    catch (e) { return null; }
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      viewer: state.viewer, links: state.links, admins: state.admins,
      announcements: state.announcements, milestones: state.milestones,
      seedVersion: state.seedVersion
    }));
  }

  function loadAdminMode() {
    try { return localStorage.getItem(ADMIN_MODE_KEY) === '1'; } catch (e) { return false; }
  }

  function saveAdminMode() {
    try { localStorage.setItem(ADMIN_MODE_KEY, state.adminMode ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────
  function showToast(msg) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.classList.add('hidden'); }, 2800);
  }

  function setAdminMode(on) {
    state.adminMode = !!on;
    document.body.classList.toggle('admin-mode', state.adminMode);
    $('btn-admin-mode').textContent = state.adminMode ? 'Edit mode: On' : 'Edit mode: Off';
    saveAdminMode();
    renderChrome();
    if (state.activeTab === 'status') renderStatusGrid();
  }

  function openModal(id) { var m = $(id); m.classList.remove('hidden'); m.setAttribute('aria-hidden', 'false'); }
  function closeModal(id) { var m = $(id); m.classList.add('hidden'); m.setAttribute('aria-hidden', 'true'); }
  function isCentralLane(lane) { return lane === 'central'; }

  function filteredMilestones() {
    return state.milestones.filter(function (ms) {
      if (!ms.isActive) return false;
      return state.laneFilter === 'all' || ms.lane === state.laneFilter;
    });
  }

  function exportCsv() {
    if (!state.adminMode) { showToast('Turn on edit mode to export CSV.'); return; }
    var rows = [['id','title','lane','startDate','endDate','color','shape','displayLabel','isActive']];
    filteredMilestones().forEach(function (m) {
      rows.push([m.id, csvEscape(m.title), m.lane, m.startDate, m.endDate, m.color, m.shape, csvEscape(m.displayLabel || ''), m.isActive ? 'true' : 'false']);
    });
    var blob = new Blob([rows.map(function (r) { return r.join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bp-pd-milestones-' + toISODate(today()) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    showToast('CSV downloaded.');
  }

  function csvEscape(s) {
    var t = String(s == null ? '' : s);
    if (/[",\n]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
    return t;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Render functions ─────────────────────────────────────────────────────────
  function renderTopBar() {
    $('topbar-date').textContent = formatWeekdayDate(new Date());
    var name = state.viewer.displayName || 'Guest';
    var extra = state.adminMode
      ? '<span style="color:#7ec8e3">Edit mode on</span> — changes save in this browser.'
      : 'Read-only view. Turn on <strong>Edit mode</strong> to update statuses and milestones.';
    $('topbar-welcome').innerHTML = '•&nbsp;&nbsp;Welcome back, ' + escapeHtml(name) + '! ' + extra;
    $('viewer-avatar').textContent = initials(name) || '—';
  }

  function renderAnnouncements() {
    var host = $('announcement-list');
    var items = state.announcements.filter(function (a) {
      if (!a.isActive) return false;
      if (!a.expiryDate) return true;
      var exp = parseISODate(a.expiryDate);
      return !exp || exp >= today();
    });
    host.innerHTML = items.map(function (a) {
      return '<div class="ann-item" data-announce-id="' + escapeHtml(a.id) + '">' +
        '<strong>' + escapeHtml(shortLead(a.text)) + '</strong> — ' +
        escapeHtml(restOfText(a.text, shortLead(a.text))) + '</div>';
    }).join('');
    host.querySelectorAll('.ann-item').forEach(function (el) {
      el.addEventListener('dblclick', function () {
        if (!state.adminMode) return;
        openAnnounceModal(el.getAttribute('data-announce-id'));
      });
    });
  }

  function shortLead(text) {
    var t = String(text || ''), m = t.match(/^([^—\n]{1,40})/);
    return m ? m[1].trim() : t.slice(0, 40).trim();
  }

  function restOfText(text, lead) {
    var t = String(text || '');
    if (t.indexOf(lead) === 0) return t.slice(lead.length).replace(/^[—\s]+/, '');
    return t;
  }

  function renderAdminSidebar() {
    var el = $('admin-list');
    el.innerHTML = state.admins.map(function (a, i) {
      var bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
      return '<div class="admin-chip">' +
        '<div class="admin-chip-avatar" style="background:' + bg + '">' + initials(a.name) + '</div>' +
        '<div class="admin-chip-meta">' +
        '<div class="admin-chip-name">' + escapeHtml(a.name) + '</div>' +
        (a.role ? '<div class="admin-chip-role">' + escapeHtml(a.role) + '</div>' : '') +
        '</div></div>';
    }).join('');
  }

  function renderSidebarLinks() {
    var defs = [
      { id: 'dependencyDashboard',    icon: '📊', label: 'Dependency Dashboard',       sub: 'Live IB/OB tracker',          group: 'artifacts' },
      { id: 'workstreamReconciliation',icon:'🔄',  label: 'Workstream Reconciliation',  sub: 'Cap ↔ SBG × Input Goals',    group: 'artifacts' },
      { id: 'capabilityRoadmap',       icon: '🗺', label: '6Q Capability Roadmap',      sub: 'Business Platform PD',        group: 'artifacts' },
      { id: 'sbgPortfolioRoadmap',     icon: '📋', label: 'SBG Portfolio Roadmap',      sub: 'Product Work Roadmap',        group: 'artifacts' },
      { id: 'fy27InputGoals',          icon: '🎯', label: 'FY27 Input Goals',           sub: 'GBSG Pass 4 (latest)',        group: 'artifacts' },
      { id: 'bpPdDriveFolder',         icon: '📁', label: 'BP PD Drive Folder',         sub: 'Planning docs & decks',       group: 'artifacts' },
      { id: 'sbgPlanningCortex',       icon: '⚡', label: 'SBG Planning Cortex',        sub: 'Central calendar',            group: 'quick' },
      { id: 'petResourceTracker',      icon: '📊', label: 'PET / Resource Tracker',     sub: 'Headcount & allocation',      group: 'quick' },
      { id: 'smartsheetBpPd',          icon: '🏗', label: 'Smartsheet: BP PD',          sub: 'Workstreams & deps',          group: 'quick' }
    ];

    function row(d) {
      var url = (state.links && state.links[d.id]) || '';
      var isConfigured = /^https?:\/\//i.test(url);
      var inner = '<span class="icon">' + d.icon + '</span>' +
        '<div><div class="label">' + escapeHtml(d.label) +
        '<div class="sublabel">' + escapeHtml(d.sub) + (isConfigured ? '' : ' · URL not set') + '</div></div></div>';
      if (isConfigured) {
        return '<a class="artifact-link" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';
      }
      return '<button type="button" class="artifact-link" data-link-miss="' + escapeHtml(d.id) + '">' + inner + '</button>';
    }

    $('sidebar-artifacts').innerHTML = defs.filter(function (d) { return d.group === 'artifacts'; }).map(row).join('');
    $('sidebar-quicklinks').innerHTML = defs.filter(function (d) { return d.group === 'quick'; }).map(row).join('');

    document.querySelectorAll('button.artifact-link[data-link-miss]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        showToast('URL not configured — edit data/seed.json and reload.');
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

  function scrollGanttToToday() {
    var wrap = $('gantt-wrap');
    if (!wrap) return;
    var todayCol = wrap.querySelector('.today-col');
    if (todayCol) {
      todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function renderGantt() {
    var tl = buildTimeline(state.scale, today());
    var periods = tl.periods, rangeStart = tl.rangeStart, rangeEnd = tl.rangeEnd;
    var tDay = today();

    var headerRow = $('gantt-header-row');
    headerRow.innerHTML = '<th class="lane-label-th">PHASE / MILESTONE</th>' +
      periods.map(function (p) {
        var cls = periodContainsToday(p, tDay) ? ' today-col today-marker' : '';
        return '<th class="' + cls.trim() + '">' + escapeHtml(p.label) + '</th>';
      }).join('');

    var body = $('gantt-body');
    body.innerHTML = '';

    var totalMs = rangeEnd - rangeStart;
    if (totalMs <= 0) totalMs = 1;

    function todayPct() {
      var x = (today() - rangeStart) / totalMs;
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

      var list = filteredMilestones().filter(function (m) { return m.lane === laneKey; });
      list.sort(function (a, b) { return String(a.startDate).localeCompare(String(b.startDate)); });

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
        grid.style.background = 'repeating-linear-gradient(90deg,#f0f2f8 0,#f0f2f8 1px,transparent 1px,transparent ' + (100 / periods.length) + '%)';

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

        function openMs() { openMilestoneModal(m.id); }
        tdLabel.addEventListener('dblclick', openMs);
        wrap.addEventListener('dblclick', openMs);

        tdTime.addEventListener('dblclick', function (ev) {
          if (!state.adminMode) return;
          if (isCentralLane(laneKey)) { showToast('Central lane is read-only.'); return; }
          if (ev.target.closest('.gantt-bar,.gantt-dot,.gantt-square,.gantt-label-float')) return;
          var rect = inner.getBoundingClientRect();
          var x = ev.clientX - rect.left;
          var pct = rect.width > 0 ? x / rect.width : 0;
          var ms3 = rangeStart.getTime() + pct * totalMs;
          var d = startOfDay(new Date(ms3));
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
    renderDeadlineStrip();
    renderPhaseBar();
    renderGantt();
  }

  // ── Admin modal ──────────────────────────────────────────────────────────────
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
    $('modal-admin-list').innerHTML = list.map(function (a, i) {
      var bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
      return '<div class="admin-row">' +
        '<div class="admin-row-avatar" style="background:' + bg + '">' + initials(a.name) + '</div>' +
        '<div class="admin-row-meta">' +
        '<div class="admin-row-name">' + escapeHtml(a.name) + '</div>' +
        '<div class="admin-row-email">' + escapeHtml(a.email) + (a.role ? ' · ' + escapeHtml(a.role) : '') + '</div>' +
        '</div><button type="button" class="btn-row-remove" data-remove-admin="' + i + '">Remove</button></div>';
    }).join('');

    $('modal-admin-list').querySelectorAll('[data-remove-admin]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-remove-admin'), 10);
        if (idx >= 0 && adminModalDraft) adminModalDraft.splice(idx, 1);
        renderAdminModalList();
      });
    });
  }

  function closeAdminModal() { adminModalDraft = null; closeModal('admin-modal'); }

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
    if (!name || !email) { showToast('Name and email are required.'); return; }
    if (!email.endsWith('@intuit.com')) { showToast('Email must end with @intuit.com'); return; }
    if (!adminModalDraft) adminModalDraft = [];
    adminModalDraft.push({ name: name, email: email, role: role });
    $('new-admin-name').value = '';
    $('new-admin-email').value = '';
    $('new-admin-role').value = '';
    renderAdminModalList();
  }

  // ── Announce modal ───────────────────────────────────────────────────────────
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
    $('announce-modal-list').innerHTML = state.announcements.map(function (a) {
      return '<div class="announce-row">' +
        '<div class="announce-row-meta">' + escapeHtml(a.postedBy || '') + ' · posted ' + escapeHtml(a.postedDate || '') +
        (a.expiryDate ? ' · expires ' + escapeHtml(a.expiryDate) : '') + ' · ' + (a.isActive ? 'active' : 'inactive') + '</div>' +
        '<div class="announce-row-text">' + escapeHtml(a.text) + '</div></div>';
    }).join('');
  }

  function saveAnnouncement() {
    var text = $('announce-text').value.trim();
    if (!text) { showToast('Message is required.'); return; }
    var id = $('announce-edit-id').value.trim();
    var exp = $('announce-expiry').value.trim();
    var active = $('announce-active').checked;
    if (id) {
      var ex = state.announcements.find(function (x) { return x.id === id; });
      if (ex) { ex.text = text; ex.expiryDate = exp; ex.isActive = active; }
    } else {
      state.announcements.push({ id: uid('ann'), text: text, postedBy: state.viewer.displayName || 'Editor', postedDate: toISODate(today()), expiryDate: exp, isActive: active });
    }
    saveLocal();
    resetAnnounceForm();
    renderAnnounceModalList();
    renderChrome();
    showToast('Announcement saved.');
  }

  // ── Milestone modal ──────────────────────────────────────────────────────────
  function fillMilestoneSelects() {
    $('milestone-lane').innerHTML = LANE_ORDER.map(function (k) {
      return '<option value="' + k + '">' + escapeHtml(LANE_LABELS[k]) + '</option>';
    }).join('');
    $('milestone-color').innerHTML = Object.keys(COLOR_CLASS).map(function (c) {
      return '<option value="' + c + '">' + c + '</option>';
    }).join('');
  }

  function openMilestoneModal(id) {
    if (!id && !state.adminMode) { showToast('Turn on edit mode to add milestones.'); return; }
    fillMilestoneSelects();
    var readOnlyCentral = false;
    var ms = id ? state.milestones.find(function (m) { return m.id === id; }) : null;
    if (ms && isCentralLane(ms.lane)) readOnlyCentral = true;
    if (!state.adminMode) readOnlyCentral = true;

    $('milestone-id').value = ms ? ms.id : '';
    $('milestone-modal-title').textContent = ms ? 'Edit milestone' : 'New milestone';
    $('milestone-modal-subtitle').textContent = readOnlyCentral
      ? 'Central Planning items are read-only (synced from SBG).'
      : state.adminMode ? 'Changes apply to this browser only.' : 'Turn on edit mode to make changes.';

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
      $('milestone-title').value = '';
      $('milestone-lane').value = defLane;
      $('milestone-color').value = 'blue';
      $('milestone-start').value = sd;
      $('milestone-end').value = preset && preset.endDate ? preset.endDate : sd;
      $('milestone-shape').value = 'dot';
      $('milestone-label').value = '';
      $('milestone-active').checked = true;
    }

    var ro = readOnlyCentral || !state.adminMode;
    ['milestone-title','milestone-lane','milestone-color','milestone-start','milestone-end','milestone-shape','milestone-label','milestone-active'].forEach(function (fid) {
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
    if (!title) { showToast('Title is required.'); return; }
    if (isCentralLane(lane)) { showToast('Cannot save into Central lane from this editor.'); return; }
    var payload = {
      id: id || uid('ms'), title: title, lane: lane, color: $('milestone-color').value,
      startDate: $('milestone-start').value, endDate: $('milestone-end').value || $('milestone-start').value,
      shape: $('milestone-shape').value, displayLabel: $('milestone-label').value.trim(),
      isActive: $('milestone-active').checked
    };
    if (!payload.startDate) { showToast('Start date is required.'); return; }
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
    if (ms && isCentralLane(ms.lane)) { showToast('Cannot delete Central lane milestones here.'); return; }
    state.milestones = state.milestones.filter(function (m) { return m.id !== id; });
    saveLocal();
    closeModal('milestone-modal');
    renderChrome();
    showToast('Milestone removed.');
  }

  // ── Event wiring ─────────────────────────────────────────────────────────────
  function wireEvents() {
    $('btn-admin-mode').addEventListener('click', function () { setAdminMode(!state.adminMode); });
    $('btn-admin-panel').addEventListener('click', openAdminModal);
    $('btn-manage-admins').addEventListener('click', openAdminModal);
    $('btn-announce').addEventListener('click', function () { openAnnounceModal(null); });
    $('btn-milestone').addEventListener('click', function () { pendingMilestonePreset = null; openMilestoneModal(null); });
    $('btn-export').addEventListener('click', exportCsv);
    $('btn-reset').addEventListener('click', function () {
      if (!confirm('Reset all milestones, announcements, and admins to the seed?')) return;
      resetToSeedEmbedded();
    });
    $('btn-today').addEventListener('click', scrollGanttToToday);

    $('admin-modal-close').addEventListener('click', closeAdminModal);
    $('admin-modal-cancel').addEventListener('click', closeAdminModal);
    $('admin-modal-save').addEventListener('click', saveAdminModal);
    $('btn-add-admin').addEventListener('click', addAdminFromForm);

    $('announce-modal-close').addEventListener('click', function () { closeModal('announce-modal'); });
    $('announce-modal-done').addEventListener('click', function () { closeModal('announce-modal'); });
    $('announce-save').addEventListener('click', saveAnnouncement);
    $('announce-cancel-edit').addEventListener('click', function () { resetAnnounceForm(); renderAnnounceModalList(); });

    $('milestone-modal-close').addEventListener('click', function () { closeModal('milestone-modal'); });
    $('milestone-cancel').addEventListener('click', function () { closeModal('milestone-modal'); });
    $('milestone-save').addEventListener('click', saveMilestone);
    $('milestone-delete').addEventListener('click', deleteMilestone);

    $('cell-modal-close').addEventListener('click', function () { closeModal('cell-modal'); });
    $('cell-modal-cancel').addEventListener('click', function () { closeModal('cell-modal'); });
    $('cell-modal-save').addEventListener('click', saveCellModal);

    $('scale-toggle').addEventListener('click', function (e) {
      var btn = e.target.closest('.scale-btn');
      if (!btn) return;
      state.scale = btn.getAttribute('data-scale');
      renderChrome();
    });
    $('lane-toggle').addEventListener('click', function (e) {
      var btn = e.target.closest('.scale-btn');
      if (!btn) return;
      state.laneFilter = btn.getAttribute('data-lane');
      renderChrome();
    });

    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.getAttribute('data-tab')); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAdminModal();
        closeModal('announce-modal');
        closeModal('milestone-modal');
        closeModal('cell-modal');
      }
    });
  }

  function resetToSeedEmbedded() {
    fetch('data/seed.json')
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (seed) { mergeSeedIntoState(seed); saveLocal(); renderChrome(); showToast('Reset complete.'); })
      .catch(function () { mergeSeedIntoState(deepClone(EMBEDDED_SEED)); saveLocal(); renderChrome(); showToast('Loaded embedded seed.'); });
  }

  async function init() {
    state.adminMode = loadAdminMode();
    document.body.classList.toggle('admin-mode', state.adminMode);
    loadPlanStatus();

    var seed = null;
    try {
      var res = await fetch('data/seed.json');
      if (res.ok) seed = await res.json();
    } catch (e) { seed = null; }

    if (!seed) {
      seed = deepClone(EMBEDDED_SEED);
      showToast('Using embedded seed — serve from GitHub Pages or a local server for full data.');
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

    $('btn-admin-mode').textContent = state.adminMode ? 'Edit mode: On' : 'Edit mode: Off';
    wireEvents();
    renderChrome();
    loadFromBackend(); // pull latest Sheet data; merges over localStorage silently
  }

  init();
})();
