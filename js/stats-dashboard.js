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
  if (mode === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (mode === "7d") {
    start = new Date(end); start.setDate(start.getDate() - 7);
  } else if (mode === "30d") {
    start = new Date(end); start.setDate(start.getDate() - 30);
  } else return { from: null, to: null };
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

// ---------- Comptages ----------
async function countRootCollection({ name, uid, range, dateFields }) {
  const q = query(collection(db, name), where("userId", "==", uid));
  const snap = await getDocs(q);
  let rows = [];
  snap.forEach(d => rows.push({ ...d.data() }));

  const pickDate = (row) => {
    for (const f of dateFields) {
      const dt = toDate(row[f]);
      if (dt) return dt;
    }
    return null;
  };
  rows = rows.filter(r => inRange(pickDate(r), range));
  console.log(`[stats] ${name}: ${rows.length}`);
  return rows.length;
}

async function countScripts({ uid, range }) {
  const coll = collection(db, `scripts/${uid}/items`);
  const snap = await getDocs(coll);
  let rows = [];
  snap.forEach(d => rows.push({ ...d.data() }));

  rows = rows.filter(r => inRange(toDate(r.createdAt), range));
  console.log(`[stats] scripts: ${rows.length}`);
  return rows.length;
}

// ---------- KPIs ----------
async function getKPIs(uid, mode) {
  const range = (mode === "custom") ? {} : makePeriodRange(mode);

  const leads   = await countRootCollection({ name:"leads", uid, range, dateFields:["createdAt","date"] });
  const emails  = await countRootCollection({ name:"emails", uid, range, dateFields:["createdAt","scheduledAt","date"] });
  const tunnels = await countRootCollection({ name:"tunnels", uid, range, dateFields:["createdAt","date"] });
  const scripts = await countScripts({ uid, range });

  return { leads, emails, tunnels, scripts };
}

// ---------- UI ----------
async function refreshAll(mode) {
  const { leads, emails, tunnels, scripts } = await getKPIs(window.__uid, mode);
  document.getElementById("kpi-leads").textContent   = leads;
  document.getElementById("kpi-emails").textContent  = emails;
  document.getElementById("kpi-scripts").textContent = scripts;
  document.getElementById("kpi-sales").textContent   = tunnels; // temporaire : tunnels affichés ici
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  window.__uid = user.uid;

  const sel = document.getElementById("period-select");
  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "Période personnalisée";
  sel.appendChild(customOpt);

  sel.value = "all"; // Par défaut, pas de filtre date
  await refreshAll("all");
});
