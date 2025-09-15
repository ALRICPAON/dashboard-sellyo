// /js/stats-dashboard.js — V1 stable (flat collections, userId == uid, filtres client)
import { app } from "/js/firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db   = getFirestore(app);

// ============== Utils dates ==============
function toDate(d) {
  if (!d) return null;
  if (typeof d === "number") return new Date(d);
  if (typeof d === "string") {
    const t = Date.parse(d);
    if (!Number.isNaN(t)) return new Date(t);
    const fr = new Date(d);
    if (!Number.isNaN(fr.getTime())) return fr;
  }
  if (d && typeof d.toDate === "function") return d.toDate(); // Firestore Timestamp
  return null;
}

function makePeriodRange(mode) {
  if (mode === "all") return { from: null, to: null };
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // demain 00:00
  let start;
  if (mode === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (mode === "7d") {
    start = new Date(end); start.setDate(start.getDate() - 7);
  } else if (mode === "30d") {
    start = new Date(end); start.setDate(start.getDate() - 30);
  } else {
    return { from: null, to: null };
  }
  return { from: start, to: end };
}

function makeCustomRange() {
  const fromEl = document.getElementById("from-date");
  const toEl   = document.getElementById("to-date");
  if (!fromEl.value && !toEl.value) return { from: null, to: null };
  const rFrom = fromEl.value ? new Date(fromEl.value + "T00:00:00") : null;
  const rTo   = toEl.value ? (() => { const d = new Date(toEl.value + "T00:00:00"); d.setDate(d.getDate() + 1); return d; })() : null;
  return { from: rFrom, to: rTo };
}

function inRange(dateObj, range) {
  if (!range || (!range.from && !range.to)) return true;
  if (!dateObj) return false;
  const t = dateObj.getTime();
  if (range.from && t < range.from.getTime()) return false;
  if (range.to   && t >= range.to.getTime())  return false;
  return true;
}

// ============== Lecture collections racine (userId == uid) ==============
async function countCollection({ name, uid, range, dateFields, extraFilter = () => true }) {
  try {
    // IMPORTANT: filtre par userId côté Firestore (aligné sur ton load-leads)
    const q = query(collection(db, name), where("userId", "==", uid));
    const snap = await getDocs(q);
    let rows = [];
    snap.forEach(d => rows.push({ id: d.id, ...d.data() }));

    const pickDate = (row) => {
      for (const f of dateFields) {
        const dt = toDate(row[f]);
        if (dt) return dt;
      }
      return null;
    };

    rows = rows.filter(r => extraFilter(r) && inRange(pickDate(r), range));
    console.log(`[stats] ${name}: lus=${snap.size}, après filtres=${rows.length}`);
    return rows.length;
  } catch (err) {
    // Affiche l’erreur dans la console et renvoie 0 pour ne pas casser l’UI
    console.error(`[stats] erreur sur ${name}:`, err);
    // Affiche un message discret si permissions
    if (String(err?.message || "").includes("Missing or insufficient permissions")) {
      showInfo("Accès refusé à certaines collections. Vérifie les règles Firestore (userId == uid).");
    }
    return 0;
  }
}

function showInfo(msg) {
  let el = document.getElementById("stats-info");
  if (!el) {
    el = document.createElement("div");
    el.id = "stats-info";
    el.style.cssText = "margin-top:12px;opacity:.8;font-size:12px;";
    document.querySelector("main header")?.appendChild(el);
  }
  el.textContent = msg;
}

// ============== KPIs ==============
async function getKPIs(uid, mode) {
  const range = (mode === "custom") ? makeCustomRange() : makePeriodRange(mode);

  const leads = await countCollection({
    name: "leads",
    uid, range,
    dateFields: ["createdAt", "date", "created_at"]
  });

  const emails = await countCollection({
    name: "emails",
    uid, range,
    dateFields: ["createdAt", "scheduledAt", "date"],
    extraFilter: (r) => r.status ? String(r.status).toLowerCase() === "sent" : true
  });

  const scripts = await countCollection({
    name: "scripts",
    uid, range,
    dateFields: ["createdAt", "date"]
  });

  // Ventes Stripe (si tu as la collection 'sales' plate)
  let sales = await countCollection({
    name: "sales",
    uid, range,
    dateFields: ["createdAt", "paidAt", "date"],
    extraFilter: (r) => ["succeeded","paid","completed"].includes(String(r.status || "").toLowerCase())
  });

  return { leads, emails, scripts, sales };
}

// ============== UI ==============
async function refreshAll(mode) {
  const { leads, emails, scripts, sales } = await getKPIs(window.__uid, mode);
  document.getElementById("kpi-leads").textContent   = leads.toLocaleString("fr-FR");
  document.getElementById("kpi-emails").textContent  = emails.toLocaleString("fr-FR");
  document.getElementById("kpi-scripts").textContent = scripts.toLocaleString("fr-FR");
  document.getElementById("kpi-sales").textContent   = sales.toLocaleString("fr-FR");
}

function setupPeriodUI() {
  const sel     = document.getElementById("period-select");
  const fromEl  = document.getElementById("from-date");
  const toEl    = document.getElementById("to-date");
  const applyBt = document.getElementById("apply-custom");

  function toggleCustom(show) {
    fromEl.style.display  = show ? "" : "none";
    toEl.style.display    = show ? "" : "none";
    applyBt.style.display = show ? "" : "none";
  }

  sel.addEventListener("change", async () => {
    if (sel.value === "custom") toggleCustom(true);
    else { toggleCustom(false); await refreshAll(sel.value); }
  });
  applyBt.addEventListener("click", async () => { await refreshAll("custom"); });
}

// ============== Bootstrap ==============
onAuthStateChanged(auth, async (user) => {
  if (!user) { console.warn("Non authentifié"); return; }
  window.__uid = user.uid;

  const sel = document.getElementById("period-select");
  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Période personnalisée";
  sel.appendChild(customOpt);

  setupPeriodUI();
  // Par défaut : Tout (pour ignorer les dates si elles sont hétérogènes)
  sel.value = "all";
  await refreshAll("all");
});
