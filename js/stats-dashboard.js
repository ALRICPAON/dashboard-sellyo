// /js/stats-dashboard.js — V1 ROOT-ONLY (collections racine)
// Lis tes collections existantes : emails, leads, scripts, tunnels
import { app, auth, db } from '/js/firebase-init.js';
import {
  collection, query, where, getCountFromServer, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// --------- Périodes ---------
function getPeriodRange(value) {
  if (value === 'all') return { from: null, to: null };
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let start;
  if (value === 'today')      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (value === '7d')    { start = new Date(end); start.setDate(start.getDate() - 7); }
  else if (value === '30d')   { start = new Date(end); start.setDate(start.getDate() - 30); }
  else                        return { from: null, to: null };
  return { from: Timestamp.fromDate(start), to: Timestamp.fromDate(end) };
}
function getCustomRange() {
  const fromEl = document.getElementById('from-date');
  const toEl = document.getElementById('to-date');
  if (!fromEl.value && !toEl.value) return { from: null, to: null };
  const from = fromEl.value ? Timestamp.fromDate(new Date(fromEl.value + 'T00:00:00')) : null;
  const to = toEl.value ? (() => { const d = new Date(toEl.value + 'T00:00:00'); d.setDate(d.getDate() + 1); return Timestamp.fromDate(d); })() : null;
  return { from, to };
}

// --------- Helpers requêtes ---------
async function safeCount(q, label) {
  try {
    const snap = await getCountFromServer(q);
    const c = snap.data().count || 0;
    console.log(`[stats] ${label} => ${c}`);
    return c;
  } catch (e) {
    console.warn(`[stats] count error for ${label}`, e);
    return 0;
  }
}
function applyDateWhereIfPossible(baseColl, range) {
  // On tente le filtre date sur createdAt; si pas indexé/champ manquant, Firestore renverra un message d’index,
  // mais on catch dans safeCount → on retombe à 0 ; dans ce cas, passer le sélecteur période sur "Tout".
  if (!range || (!range.from && !range.to)) return query(baseColl);
  let q = query(baseColl);
  if (range.from) q = query(q, where('createdAt', '>=', range.from));
  if (range.to)   q = query(q, where('createdAt', '<', range.to));
  return q;
}

// --------- Comptages (root collections) ---------
async function countRootCollection(name, range) {
  const coll = collection(db, name);
  const q = applyDateWhereIfPossible(coll, range);
  return safeCount(q, name);
}

// Pour que ça colle à ce que tu as déjà à l’écran :
async function getLeadCount(range)    { return countRootCollection('leads', range); }
async function getEmailCount(range)   { return countRootCollection('emails', range); }
async function getScriptCount(range)  { return countRootCollection('scripts', range); }
// En attendant le webhook Stripe dédié, on affiche "Tunnels créés" (tu as bien une collection 'tunnels')
async function getTunnelCount(range)  { return countRootCollection('tunnels', range); }

async function refreshAll() {
  const sel = document.getElementById('period-select');
  const mode = sel.value;
  const range = (mode === 'all') ? { from: null, to: null }
              : (mode === 'today' || mode === '7d' || mode === '30d')
                ? getPeriodRange(mode)
                : getCustomRange();

  console.log('[stats] range =', range);

  const [leads, emails, scripts, tunnels] = await Promise.all([
    getLeadCount(range),
    getEmailCount(range),
    getScriptCount(range),
    getTunnelCount(range),
  ]);

  document.getElementById('kpi-leads').textContent   = leads.toLocaleString('fr-FR');
  document.getElementById('kpi-emails').textContent  = emails.toLocaleString('fr-FR');
  document.getElementById('kpi-scripts').textContent = scripts.toLocaleString('fr-FR');
  document.getElementById('kpi-sales').textContent   = tunnels.toLocaleString('fr-FR'); // label "Ventes" temporaire → "Tunnels créés"
}

function setupPeriodUI() {
  const sel = document.getElementById('period-select');
  const fromEl = document.getElementById('from-date');
  const toEl = document.getElementById('to-date');
  const applyBtn = document.getElementById('apply-custom');

  function toggleCustom(show) {
    fromEl.style.display = show ? '' : 'none';
    toEl.style.display = show ? '' : 'none';
    applyBtn.style.display = show ? '' : 'none';
  }
  sel.addEventListener('change', async () => {
    if (sel.value === 'custom') toggleCustom(true);
    else { toggleCustom(false); await refreshAll(); }
  });
  applyBtn.addEventListener('click', refreshAll);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { console.warn('Non authentifié'); return; }
  // Ajoute l’option Custom
  const sel = document.getElementById('period-select');
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Période personnalisée';
  sel.appendChild(customOpt);

  setupPeriodUI();
  await refreshAll();
});
