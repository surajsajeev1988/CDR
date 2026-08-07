/**
 * CDR Study — Apps Script backend
 *
 * Serves the app and keeps the study in YOUR Google Drive:
 *   - a folder "CDR Study" holding cdr_state.json (research data only —
 *     the app strips patient names/ICs before anything is sent here)
 *   - a readable spreadsheet, refreshed on every sync
 *   - stamped JSON files when you use "Export JSON" inside the app
 *
 * SETUP
 *  1. In this Apps Script project, keep the app's HTML in a file named
 *     "index" (index.html). Paste this code into Code.gs.
 *  2. Deploy → New deployment → Web app:
 *       Execute as: Me · Who has access: Only myself
 *     Open the web app URL — that's the app.
 *  3. (Optional, only for syncing OTHER computers via URL+key:)
 *     Project Settings → Script properties → add API_KEY = <your key>,
 *     and redeploy with "Who has access: Anyone". Paste the URL and key
 *     into the app's Cloud sync box on the other computer.
 */

var FOLDER_NAME = 'CDR Study';
var STATE_FILE  = 'cdr_state.json';
var SHEET_NAME  = 'CDR Study (readable)';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CDR Study')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* Entry point for google.script.run from inside the app */
function api(body) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (body && body.action) {
        case 'meta':     return meta_();
        case 'pull':     return pull_();
        case 'push':     return push_(body);
        case 'download': return download_();
        default:         return { error: 'Unknown action' };
      }
    } finally {
      lock.releaseLock();
    }
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}

/* Entry point for other computers posting to the web app URL with a key */
function doPost(e) {
  var out = ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON);
  var body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return out.setContent(JSON.stringify({ error: 'Bad request' })); }
  var key = PropertiesService.getScriptProperties().getProperty('API_KEY') || '';
  if (!key || body.token !== key)
    return out.setContent(JSON.stringify({ error: 'Wrong key — check the Script property API_KEY' }));
  return out.setContent(JSON.stringify(api(body)));
}

/* ---------------- storage helpers ---------------- */

function folder_() {
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function stateFile_() {
  var it = folder_().getFilesByName(STATE_FILE);
  return it.hasNext() ? it.next() : null;
}

function readStateRaw_() {
  var f = stateFile_();
  return f ? f.getBlob().getDataAsString() : null;
}

function props_() { return PropertiesService.getScriptProperties(); }

function metaObj_() {
  var p = props_();
  return {
    rev: Number(p.getProperty('rev') || 0),
    updatedAt: p.getProperty('updatedAt') || '',
    updatedBy: p.getProperty('updatedBy') || ''
  };
}

/* ---------------- actions ---------------- */

function meta_() { return metaObj_(); }

function pull_() {
  var raw = readStateRaw_();
  var m = metaObj_();
  if (!raw) return { state: null, rev: m.rev };
  return { state: JSON.parse(raw), rev: m.rev, updatedAt: m.updatedAt, updatedBy: m.updatedBy };
}

function push_(body) {
  var p = props_();
  var cur = Number(p.getProperty('rev') || 0);
  var base = Number(body.baseRev || 0);
  if (!body.force && cur > 0 && base !== cur) {
    var raw = readStateRaw_();
    return {
      conflict: true,
      state: raw ? JSON.parse(raw) : null,
      rev: cur,
      updatedAt: p.getProperty('updatedAt') || '',
      updatedBy: p.getProperty('updatedBy') || ''
    };
  }
  var json = JSON.stringify(body.state || {});
  var f = stateFile_();
  if (f) f.setContent(json); else folder_().createFile(STATE_FILE, json, 'application/json');
  var rev = cur + 1;
  p.setProperty('rev', String(rev));
  p.setProperty('updatedAt', new Date().toISOString());
  p.setProperty('updatedBy', String(body.device || 'unknown'));
  if (body.rows && body.rows.length) writeRows_(body.rows);
  return { rev: rev };
}

function download_() {
  var raw = readStateRaw_();
  if (!raw) return { error: 'Nothing saved yet — sync first' };
  var d = new Date();
  function z(n) { return ('0' + n).slice(-2); }
  var name = 'CDR_study_' + d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) +
             '_' + z(d.getHours()) + z(d.getMinutes()) + '.json';
  var f = folder_().createFile(name, raw, 'application/json');
  return { name: name, url: f.getUrl() };
}

/* ---------------- readable sheet ---------------- */

function writeRows_(rows) {
  var folder = folder_();
  var ss = null;
  var it = folder.getFilesByName(SHEET_NAME);
  if (it.hasNext()) {
    ss = SpreadsheetApp.open(it.next());
  } else {
    ss = SpreadsheetApp.create(SHEET_NAME);
    DriveApp.getFileById(ss.getId()).moveTo(folder);
  }
  var width = 0;
  rows.forEach(function (r) { if (r.length > width) width = r.length; });
  var safe = rows.map(function (r) {
    var o = [];
    for (var i = 0; i < width; i++) {
      var v = (i < r.length && r[i] != null) ? r[i] : '';
      if (typeof v === 'string' && /^[=+@]/.test(v)) v = "'" + v;  // never as a formula
      o.push(v);
    }
    return o;
  });
  var sh = ss.getSheets()[0];
  sh.clearContents();
  if (safe.length) sh.getRange(1, 1, safe.length, width).setValues(safe);
  sh.setFrozenRows(1);
}
