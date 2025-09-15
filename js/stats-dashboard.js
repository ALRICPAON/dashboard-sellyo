// /js/stats-dashboard.js
import { app, auth, db } from '/js/firebase-init.js'; // ton init existant
import {
  collection, query, where, getCountFromServer, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// ---------- Helpers période ----------
function getPeriodRange(value) {
  if (value === 'all') return { from: null, to: null };
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // demain 00:00
  let start;
  if (value === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // aujourd'hui 00:00
  } else if (value === '7d') {
    start = new Date(end); start.setDate(start.getDate() - 7);
  } else if (value === '30d') {
    start = new Date(end); start.setDate(start.getDate() - 30);
  } else {
    return { from: null, to: null };
  }
  return { from: Timestamp.fromDate(start), to: Timestamp.fromDate(end) };
}

function getCustomRange() {
  const fromEl = document.getElementById('from-date');
  const toEl = document.getElementById('to-date');
  if (!fromEl.value && !toEl.value) return { from: null, to: null };
  const from = fromEl.value ? Timestamp.fromDate(new Date(fromEl.value + 'T00:00:00')) : null;
  // to = lendemain 00:00 pour être exclusif
  const to = toEl.value ? (() => {
    const d = new Date(toEl.value + 'T00:00:00'); d.setDate(d.getDate() + 1); return Timestamp.fromDate(d);
  })() : null;
  return { from, to };
}

// ---------- Count util (fait plusieurs tentatives de chemins) ----------
async function safeCount(q) {
  try {
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (e) {
    console.warn('count error', e);
    return 0;
  }
}

function applyDateWhere(baseColl, range) {
  if (!range || (!range.from && !range.to)) return query(baseColl);
  const clauses = [];
  if (range.from) clauses.push(where('createdAt', '>=', range.from));
  if (range.to)   clauses.push(where('createdAt', '<', range.to));
  // build query incrementally
  return clauses.reduce((qAcc, w) => query(qAcc, w), query(baseColl));
}

// ---------- 1) Leads ----------
async function getLeadCount(uid, range) {
  // Variantes courantes dans Sellyo :
  // - leads/{uid}/items/* (subcollection)
  // - leads/* avec champ userId == uid (flat)
  const attempts = [
    applyDateWhere(collection(db, `leads/${uid}/items`), range),
    applyDateWhere(collection(db, 'leads'), range), // filtré après si besoin
  ];
  let total = 0;
  // first: subcollection direct
  total += await safeCount(attempts[0]);
  // second: flat collection filtrée par userId
  const flatQ = query(attempts[1], where('userId', '==', uid));
  total += await safeCount(flatQ);
  return total;
}

// ---------- 2) Emails envoyés ----------
async function getEmailSentCount(uid, range) {
  // Variantes possibles :
  // - emails/{uid}/items/* avec status: 'sent'
  // - emails/{uid}/sent/* (collection dédiée)
  // - emails/* flat avec userId + status
  const queries = [
    query(applyDateWhere(collection(db, `emails/${uid}/items`), range), where('status', '==', 'sent')),
    applyDateWhere(collection(db, `emails/${uid}/sent`), range),
    query(applyDateWhere(collection(db, 'emails'), range), where('userId', '==', uid), where('status', '==', 'sent')),
  ];
  let total = 0;
  for (const q of queries) total += await safeCount(q);
  return total;
}

// ---------- 3) Scripts vidéo créés ----------
async function getScriptCount(uid, range) {
  // scripts/{uid}/items/*  (champ createdAt déjà présent chez toi)
  const q = applyDateWhere(collection(db, `scripts/${uid}/items`), range);
  return safeCount(q);
}

// ---------- 4) Ventes (Stripe) ----------
async function getSalesCount(uid, range) {
  // sales/{uid}/items/*  (peuplé par le webhook Stripe)
  // Option: status == 'paid' / 'succeeded'
  const base = applyDateWhere(collection(db, `sales/${uid}/items`), range);
  const q = query(base, where('status', 'in', ['paid', 'succeeded', 'completed']));
  // Si ton statut n’est pas encore normalisé, on tente aussi sans filtre
  const [strict, fallback] = await Promise.all([safeCount(q), safeCount(base)]);
  return strict || fallback; // préfère strict si non nul
}

// ---------- UI binding ----------
async function refreshAll(uid) {
  const periodSelect = document.getElementById('period-select');
  const mode = periodSelect.value;
  const range = (mode === 'all') ? { from: null, to: null }
              : (mode === 'today' || mode === '7d' || mode === '30d')
                ? getPeriodRange(mode)
                : getCustomRange();

  const [leads, emails, scripts, sales] = await Promise.all([
    getLeadCount(uid, range),
    getEmailSentCount(uid, range),
    getScriptCount(uid, range),
    getSalesCount(uid, range),
  ]);

  document.getElementById('kpi-leads').textContent = leads.toLocaleString('fr-FR');
  document.getElementById('kpi-emails').textContent = emails.toLocaleString('fr-FR');
  document.getElementById('kpi-scripts').textContent = scripts.toLocaleString('fr-FR');
  document.getElementById('kpi-sales').textContent = sales.toLocaleString('fr-FR');
}

function setupPeriodUI(uid) {
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
    if (sel.value === 'custom') {
      toggleCustom(true);
    } else {
      toggleCustom(false);
      await refreshAll(uid);
    }
  });

  applyBtn.addEventListener('click', async () => {
    await refreshAll(uid);
  });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.warn('Non authentifié — redirige si besoin');
    return;
  }
  const uid = user.uid;

  // Ajoute l’option "Période personnalisée"
  const sel = document.getElementById('period-select');
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Période personnalisée';
  sel.appendChild(customOpt);

  setupPeriodUI(uid);
  await refreshAll(uid);
});
