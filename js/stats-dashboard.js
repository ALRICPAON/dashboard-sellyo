import { app } from "/js/firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db   = getFirestore(app);

let ACTIVITY = { leads: [], emails: [], scripts: [], tunnels: [] }; // cache pour le graphe
let chart;

// ---------- Utils ----------
function toDate(d) {
  if (!d) return null;
  if (typeof d === "number") return new Date(d);
  if (typeof d === "string") {
    const t = Date.parse(d);
    if (!Number.isNaN(t)) return new Date(t);
    const fr = new Date(d);
    if (!Number.isNaN(fr.getTime())) return fr;
  }
  if (d && typeof d.toDate === "function") return d.toDate();
  return null;
}
function makePeriodRange(mode) {
  if (mode === "all") return { from: null, to: null };
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  let start;
  if (mode === "today") { start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); }
  else if (mode === "7d") { start = new Date(end); start.setDate(start.getDate() - 7); }
  else if (mode === "30d"){ start = new Date(end); start.setDate(start.getDate() - 30); }
  else return { from: null, to: null };
  return { from: start, to: end };
}
function inRange(dateObj, range) {
  if (!range || (!range.from && !range.to)) return true;
  if (!dateObj) return false;
  const t = dateObj.getTime();
  if (range.from && t < range.from.getTime()) return false;
  if (range.to   && t >= range.to.getTime())  return false;
  return true;
}
function fmtDay(d) { // yyyy-mm-dd
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function daysWindow(n=30){ // array of yyyy-mm-dd for last n days
  const out = [];
  const end = new Date(); end.setHours(0,0,0,0);
  for(let i=n-1;i>=0;i--){ const d = new Date(end); d.setDate(end.getDate()-i); out.push(fmtDay(d)); }
  return out;
}

// ---------- Lectures ----------
async function fetchRoot({ name, uid, dateFields }) {
  const q = query(collection(db, name), where("userId","==",uid));
  const snap = await getDocs(q);
  const rows = [];
  snap.forEach(d => rows.push({ ...d.data() }));
  // map date
  rows.forEach(r => {
    for(const f of dateFields){ const dt = toDate(r[f]); if(dt){ r.__date = dt; break; } }
  });
  return rows;
}
async function fetchScripts({ uid }) {
  const coll = collection(db, `scripts/${uid}/items`);
  const snap = await getDocs(coll);
  const rows = [];
  snap.forEach(d => rows.push({ ...d.data() }));
  rows.forEach(r => r.__date = toDate(r.createdAt));
  return rows;
}

// ---------- KPIs + activité ----------
async function getData(uid) {
  const [leads, emails, tunnels, scripts] = await Promise.all([
    fetchRoot({ name:"leads",   uid, dateFields:["createdAt","date"] }),
    fetchRoot({ name:"emails",  uid, dateFields:["createdAt","scheduledAt","date"] }),
    fetchRoot({ name:"tunnels", uid, dateFields:["createdAt","date"] }),
    fetchScripts({ uid })
  ]);
  ACTIVITY = { leads, emails, tunnels, scripts };
}

function countInRange(rows, range, extraFilter = () => true) {
  return rows.filter(r => extraFilter(r) && inRange(r.__date, range)).length;
}

function bucketByDay(rows, days=30, extraFilter = () => true) {
  const labels = daysWindow(days);
  const map = Object.fromEntries(labels.map(l => [l,0]));
  rows.forEach(r => {
    if (!r.__date) return;
    const d = new Date(r.__date); d.setHours(0,0,0,0);
    const key = fmtDay(d);
    if (key in map && extraFilter(r)) map[key] += 1;
  });
  return { labels, data: labels.map(l => map[l]) };
}

// ---------- UI main ----------
async function refreshAll(mode) {
  const range = (mode === "custom") ? makePeriodRange("30d") : makePeriodRange(mode); // pour 7j/30j/all/today
  // KPIs principaux
  const leads   = countInRange(ACTIVITY.leads,   range);
  const emails  = countInRange(ACTIVITY.emails,  range, r => !r.status || String(r.status).toLowerCase()==="sent");
  const scripts = countInRange(ACTIVITY.scripts, range);
  const tunnels = countInRange(ACTIVITY.tunnels, range);

  document.getElementById("kpi-leads").textContent   = leads.toLocaleString("fr-FR");
  document.getElementById("kpi-emails").textContent  = emails.toLocaleString("fr-FR");
  document.getElementById("kpi-scripts").textContent = scripts.toLocaleString("fr-FR");
  document.getElementById("kpi-sales").textContent   = tunnels.toLocaleString("fr-FR"); // “Tunnels créés”

  // Cartes bonus (7 jours glissants, indépendantes du select)
  const r7 = makePeriodRange("7d");
  document.getElementById("kpi-leads-7d").textContent   = countInRange(ACTIVITY.leads,   r7).toLocaleString("fr-FR");
  document.getElementById("kpi-emails-7d").textContent  = countInRange(ACTIVITY.emails,  r7, r => !r.status || String(r.status).toLowerCase()==="sent").toLocaleString("fr-FR");
  document.getElementById("kpi-scripts-7d").textContent = countInRange(ACTIVITY.scripts, r7).toLocaleString("fr-FR");

  // Graphe 30 jours (multi-séries)
  renderChart();
}

function renderChart() {
  const ctx = document.getElementById("chart-activity");
  const byLeads   = bucketByDay(ACTIVITY.leads,   30);
  const byEmails  = bucketByDay(ACTIVITY.emails,  30, r => !r.status || String(r.status).toLowerCase()==="sent");
  const byScripts = bucketByDay(ACTIVITY.scripts, 30);
  const byTunnels = bucketByDay(ACTIVITY.tunnels, 30);

  const seriesSelect = document.getElementById("series-select");
  const datasetsAll = [
    { label: "Leads",   data: byLeads.data },
    { label: "Emails",  data: byEmails.data },
    { label: "Scripts", data: byScripts.data },
    { label: "Tunnels", data: byTunnels.data },
  ];

  let datasets;
  if (seriesSelect.value === "all") datasets = datasetsAll;
  else {
    const map = { leads:0, emails:1, scripts:2, tunnels:3 };
    datasets = [ datasetsAll[ map[seriesSelect.value] ] ];
  }

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: { labels: byLeads.labels, datasets },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#ddd" } },
        tooltip: { enabled: true }
      },
      scales: {
        x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,.06)" } },
        y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,.06)" }, beginAtZero: true }
      }
    }
  });
}

// ---------- Boot ----------
function setupUI() {
  const sel = document.getElementById("period-select");
  const customOpt = document.createElement("option");
  customOpt.value = "custom"; customOpt.textContent = "Période personnalisée";
  sel.appendChild(customOpt);

  // filtre période cartes principales
  sel.addEventListener("change", async () => { await refreshAll(sel.value); });

  // changement de séries du graphe
  document.getElementById("series-select").addEventListener("change", () => renderChart());
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  window.__uid = user.uid;

  setupUI();
  await getData(user.uid);     // charge toutes les collections (userId == uid + scripts/{uid}/items)
  document.getElementById("period-select").value = "all"; // par défaut, pas de filtre
  await refreshAll("all");
});
