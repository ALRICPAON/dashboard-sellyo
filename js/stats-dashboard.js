// /js/stats-dashboard.js — V1 alignée avec load-leads (collections racine, userId == uid)
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
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ---------- Utils dates (on gère string FR/ISO/number) ----------
function toDate(d) {
  if (!d) return null;
  if (typeof d === "number") return new Date(d);
  if (typeof d === "string") {
    // essaye ISO
    const iso = Date.parse(d);
    if (!Number.isNaN(iso)) return new Date(iso);
    // essaye FR "4 août 2025 ..." => on tente le parsing navigateur
    const fr = new Date(d);
    if (!Number.isNaN(fr.getTime())) return fr;
  }
  // Firestore Timestamp ? (au cas où)
  if (d && typeof d.toDate === "function") return d.toDate();
  return null;
}

function getPeriodRange(mode) {
  if (mode === "all") return { from: null, to: null };
  const now = new Date();
  // borne sup exclusive = demain 00:00
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
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
  return { from, to: end };
}

function getCustomRange() {
  const fromEl = document.getElementById("from-date");
  const toEl = document.getElementById("to-date");
  if (!fromEl.value && !toEl.value) return { from: null, to: null };
  const from = fromEl.value ? new Date(fromEl.value + "T00:00:00") : null;
  const to = toEl.value ? (() => { const d = new Date(toEl.value + "T00:00:00"); d.setDate(d.getDate() + 1); return d; })() : null;
  return { from, to };
}

function inRange(dateObj, range) {
  if (!range || (!range.from && !range.to)) return true;
  if (!dateObj) return false; // pas de date → pas dans la période
  const t = dateObj.getTime();
  if (range.from && t < range.from.getTime()) return false;
  if (range.to   && t >= range.to.getTime())   return false;
  return true;
}

// ---------- Lectures (flat collections, userId == uid) ----------
async function countCollection({ name, uid, range, dateFieldCandidates, extraFilter = () => true }) {
  // On lit la collection racine avec userId == uid
  const q = query(collection(db, name), where("userId", "==", uid));
  const snap = await getDocs(q);
  let rows = [];
  snap.forEach(doc => rows.push({ id: doc.id, ...doc.data() }));

  // Cherche un champ date plausible parmi plusieurs noms possibles
  const pickDate = (row) => {
    for (const key of dateFieldCandidates) {
      const v = row[key];
      const dt = toDate(v);
      if (dt) return dt;
    }
    return null;
  };

  // Filtre période + filtre additionnel (ex: status ventes/emails)
  rows = rows.filter(r => extraFilter(r) && inRange(pickDate(r), range));

  console.log(`[stats] ${name} → ${rows.length} éléments après filtres (total lus: ${snap.size})`);
  return rows.length;
}

// ---------- KPI calcul ----------
async function getKPIs(uid, modeOrRange) {
  const range = (typeof modeOrRange === "string")
    ? (modeOrRange === "custom" ? getCustomRange() : getPeriodRange(modeOrRange))
    : modeOrRange;

  // Leads (createdAt / date)
  const leads = await countCollection({
    name: "leads",
    uid,
    range,
    dateFieldCandidates: ["createdAt", "date", "created_at"]
  });

  // Emails (on compte de préférence status: 'sent', sinon tout)
  let emails = await countCollection({
    name: "emails",
    uid,
    range,
    dateFieldCandidates: ["createdAt", "scheduledAt", "date"],
    extraFilter: (r) => r.status ? r.status === "sent" : true
  });

  // Scripts (IA + FaceCam)
  const scripts = await countCollection({
    name: "scripts",
    uid,
    range,
    dateFieldCandidates: ["createdAt", "date"]
  });

  // Ventes Stripe (si tu as une collection 'sales' plate)
  // status plausible: 'succeeded', 'paid', 'completed'
  let sales = 0;
  try {
    sales = await countCollection({
      name: "sales",
      uid,
      range,
      dateFieldCandidates: ["createdAt", "paidAt", "date"],
      extraFilter: (r) => {
        const s = (r.status || "").toLowerCase();
        return ["succeeded", "paid", "completed"].includes(s);
      }
    });
  } catch (e) {
    console.warn("[stats] Pas de collection 'sales' (OK pour V1), on laisse 0.");
    sales = 0;
  }

  return { leads, emails, scripts, sales };
}

// ---------- UI ----------
async function refreshAll(mode) {
  const { leads, emails, scripts, sales } = await getKPIs(window.__uid, mode);

  document.getElementById("kpi-leads").textContent   = leads.toLocaleString("fr-FR");
  document.getElementById("kpi-emails").textContent  = emails.toLocaleString("fr-FR");
  document.getElementById("kpi-scripts").textContent = scripts.toLocaleString("fr-FR");
  document.getElementById("kpi-sales").textContent   = sales.toLocaleString("fr-FR");
}

function setupPeriodUI() {
  const sel = document.getElementById("period-select");
  const fromEl = document.getElementById("from-date");
  const toEl = document.getElementById("to-date");
  const applyBtn = document.getElementById("apply-custom");

  function toggleCustom(show) {
    fromEl.style.display = show ? "" : "none";
    toEl.style.display = show ? "" : "none";
    applyBtn.style.display = show ? "" : "none";
  }

  sel.addEventListener("change", async () => {
    if (sel.value === "custom") {
      toggleCustom(true);
    } else {
      toggleCustom(false);
      await refreshAll(sel.value);
    }
  });
  applyBtn.addEventListener("click", async () => {
    await refreshAll("custom");
  });
}

// ---------- Bootstrap ----------
onAuthStateChanged(auth, async (user) => {
  if (!user) { console.warn("Non authentifié"); return; }
  window.__uid = user.uid;

  // Ajoute l’option "Période personnalisée"
  const sel = document.getElementById("period-select");  // ⚠️ il faut la redéclarer ici
  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Période personnalisée";
  sel.appendChild(customOpt);

  setupPeriodUI();

  // Par défaut : 7 jours
  await refreshAll(sel.value || "7d");
});
