// TAGS
function updateTags(type, val) {
  const sep = val.includes('|') ? '|' : ',';
  const tags = val
    .split(sep)
    .map(s => s.trim())
    .filter(Boolean);
  document.getElementById(type + '-tags').innerHTML = tags
    .map(t => '<span class="comp-tag">' + t + '</span>')
    .join('');
}

// IMAGES
function triggerImg(id) {
  document.getElementById(id).click();
}
function loadImgTo(input, cid) {
  const f = input.files[0];
  if (!f) return;
  const pName = CURRENT_POINT ? String(CURRENT_POINT[PT.punto] || '') : '';
  const key = pName + '__' + cid;
  const reader = new FileReader();
  reader.onload = function (e) {
    IMG_STORE[key] = e.target.result;
    renderImg(cid, key, input);
  };
  reader.readAsDataURL(f);
}

// NAV
function showSection(id, tabEl) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (tabEl) tabEl.classList.add('active');
}

// ---- Section visibility manager ----
// Ordered registry of all toggleable apartados (excludes the ⚙ button itself)
const SEC_DEFS = [
  { id: 's-contexto', label: 'Contexto' },
  { id: 's-accesibilidad', label: 'Accesibilidad' },
  { id: 's-calor-trabajo', label: 'Mapa Trabajo' },
  { id: 's-calor-domicilio', label: 'Mapa Domicilio' },
  { id: 's-calor-general', label: 'Mapa de Calor' },
  { id: 's-rutas-calientes', label: 'Rutas Calientes' },
  { id: 's-15min', label: 'Cumplimiento 15 min', mins: 15 },
  { id: 's-20min', label: 'Cumplimiento 20 min', mins: 20 },
  { id: 's-30min', label: 'Cumplimiento 30 min', mins: 30 },
  { id: 's-comparables', label: 'Comparables' },
  { id: 's-overlap', label: 'Overlap' },
  { id: 's-calificacion', label: 'Calificación' },
  { id: 's-hallazgos', label: 'Hallazgos' },
  { id: 's-confidencialidad', label: 'Confidencialidad' }
];
var HIDDEN_SECS = new Set();
var _AVAIL_MINS = [15, 20, 30];

function _tabForSection(secId) {
  var tab = null;
  document.querySelectorAll('#main-nav-tabs .nav-tab').forEach(function (t) {
    var oc = t.getAttribute('onclick') || '';
    if (oc.indexOf("'" + secId + "'") !== -1) tab = t;
  });
  return tab;
}
function _secIsAvailable(def) {
  if (def.mins !== undefined) return _AVAIL_MINS.includes(def.mins);
  return true;
}
function applySectionVis() {
  var firstVisibleId = null;
  SEC_DEFS.forEach(function (def) {
    var tab = _tabForSection(def.id);
    var sec = document.getElementById(def.id);
    var visible = _secIsAvailable(def) && !HIDDEN_SECS.has(def.id);
    if (tab) tab.style.display = visible ? '' : 'none';
    if (sec && !visible) sec.classList.remove('active');
    if (visible && !firstVisibleId) firstVisibleId = def.id;
  });
  // If the active section got hidden, move to the first visible one
  var anyActive = document.querySelector('#report-screen .section.active');
  if ((!anyActive || anyActive.style.display === 'none') && firstVisibleId) {
    showSection(firstVisibleId, _tabForSection(firstVisibleId));
  }
}
function toggleSectionVis(secId, show) {
  if (show) HIDDEN_SECS.delete(secId);
  else HIDDEN_SECS.add(secId);
  applySectionVis();
}
function buildManagePanel() {
  var panel = document.getElementById('manage-panel');
  if (!panel) return;
  var html =
    '<div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;padding:.2rem .7rem .5rem">Mostrar apartados</div>';
  SEC_DEFS.forEach(function (def) {
    if (!_secIsAvailable(def)) return; // skip compliance times with no data
    var checked = HIDDEN_SECS.has(def.id) ? '' : 'checked';
    html +=
      '<label style="display:flex;align-items:center;gap:.5rem;padding:.32rem .7rem;cursor:pointer;font-size:.84rem;color:var(--text)">' +
      '<input type="checkbox" ' +
      checked +
      ' onchange="toggleSectionVis(\'' +
      def.id +
      '\',this.checked);buildManagePanel()" style="cursor:pointer">' +
      '<span>' +
      def.label +
      '</span></label>';
  });
  panel.innerHTML = html;
}
function toggleManagePanel() {
  var panel = document.getElementById('manage-panel');
  if (!panel) return;
  if (panel.style.display === 'none' || !panel.style.display) {
    buildManagePanel();
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}
// Close the panel when clicking elsewhere
document.addEventListener('click', function (e) {
  var panel = document.getElementById('manage-panel');
  var btn = document.getElementById('apartados-btn');
  if (!panel || panel.style.display === 'none') return;
  if (panel.contains(e.target) || (btn && btn.contains(e.target))) return;
  panel.style.display = 'none';
});
function goBack() {
  document.getElementById('report-screen').style.display = 'none';
  document.getElementById('upload-screen').style.display = 'flex';
}
