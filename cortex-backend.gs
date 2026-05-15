/**
 * BP PD Planning Cortex — Apps Script backend
 *
 * Deploy as: Extensions → Apps Script → Deploy → New deployment
 *   Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone within Intuit (or "Anyone" if org policy requires)
 *
 * After deploying, copy the web app URL into data/seed.json → "backendUrl".
 *
 * Sheet structure (auto-created on first write):
 *   Tab "PlanStatus"  — columns: leaderKey | deliverableKey | status | note | updatedBy | updatedAt
 *   Tab "TpmStatus"   — columns: memberKey  | activityKey   | status | note | updatedBy | updatedAt
 */

var PLAN_SHEET  = 'PlanStatus';
var TPM_SHEET   = 'TpmStatus';
var SHEET_COLS  = ['rowKey', 'colKey', 'status', 'note', 'updatedBy', 'updatedAt'];

// ── GET — return all rows from both tabs as JSON ────────────────────────────
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = {
      planStatus: sheetToObject(getOrCreateSheet(ss, PLAN_SHEET)),
      tpmStatus:  sheetToObject(getOrCreateSheet(ss, TPM_SHEET))
    };
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ── POST — upsert one cell ──────────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var grid    = payload.grid;    // 'plan' or 'tpm'
    var rowKey  = payload.rowKey;
    var colKey  = payload.colKey;
    var status  = payload.status;
    var note    = payload.note    || '';
    var updater = payload.updatedBy || 'unknown';

    if (!grid || !rowKey || !colKey || !status) {
      return jsonResponse({ error: 'Missing required fields: grid, rowKey, colKey, status' }, 400);
    }

    var sheetName = grid === 'tpm' ? TPM_SHEET : PLAN_SHEET;
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(ss, sheetName);

    upsertRow(sheet, rowKey, colKey, status, note, updater);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data, statusCode) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEET_COLS);
    sheet.setFrozenRows(1);
    // Style header row
    var header = sheet.getRange(1, 1, 1, SHEET_COLS.length);
    header.setFontWeight('bold');
    header.setBackground('#1e2d6b');
    header.setFontColor('#ffffff');
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 160);
    sheet.setColumnWidth(3, 90);
    sheet.setColumnWidth(4, 280);
    sheet.setColumnWidth(5, 160);
    sheet.setColumnWidth(6, 180);
  }
  return sheet;
}

function sheetToObject(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};  // header only
  var result = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rowKey = row[0], colKey = row[1], status = row[2], note = row[3];
    if (!rowKey || !colKey) continue;
    result[rowKey + '|' + colKey] = { status: String(status || 'pending'), note: String(note || '') };
  }
  return result;
}

function upsertRow(sheet, rowKey, colKey, status, note, updatedBy) {
  var data   = sheet.getDataRange().getValues();
  var now    = new Date().toISOString();
  var target = null;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === rowKey && data[i][1] === colKey) {
      target = i + 1; // 1-indexed sheet row
      break;
    }
  }

  if (target) {
    sheet.getRange(target, 1, 1, 6).setValues([[rowKey, colKey, status, note, updatedBy, now]]);
  } else {
    sheet.appendRow([rowKey, colKey, status, note, updatedBy, now]);
  }
}
