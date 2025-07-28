import { app } from "./firebase-init.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Références DOM
const manualInput = document.getElementById("manual-emails");
const leadDropdown = document.getElementById("lead-dropdown");
const landingDropdown = document.getElementById("link-content");
const addManualBtn = document.getElementById("add-manual-btn");
const addLeadBtn = document.getElementById("add-lead-btn");
const addLandingBtn = document.getElementById("add-landing-btn");
const saveBtn = document.getElementById("save-manual");
const table = document.querySelector("#recipients-table tbody");
const feedback = document.getElementById("feedback");

const selectedRecipients = new Set(); // Pour éviter les doublons

// ➕ Fonction pour ajouter un email dans le tableau
function addToTable(email, source) {
  const key = `${email}-${source}`;
  if (selectedRecipients.has(key)) return;

  selectedRecipients.add(key);

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${email}</td>
    <td>${source}</td>
    <td><button onclick="this.closest('tr').remove(); selectedRecipients.delete('${key}')">❌</button></td>
  `;
  table.appendChild(row);
}

// 🔐 Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  const userId = user.uid;
  console.log("✅ Utilisateur connecté :", userId);

  // Charger les leads
  const q = query(collection(db, "leads"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const leads = [];
  querySnapshot.forEach((doc) => leads.push({ id: doc.id, ...doc.data() }));

  console.log("📦 Leads récupérés :", leads.length);
  leads.forEach(lead => {
    const opt = document.createElement("option");
    opt.value = lead.email;
    opt.textContent = `${lead.nom || ""} ${lead.prenom || ""} (${lead.email})`;
    leadDropdown.appendChild(opt);
  });

  // Charger les landing/tunnel disponibles
  const tunnelQuery = query(collection(db, "tunnels"), where("userId", "==", userId));
  const tunnelSnap = await getDocs(tunnelQuery);
  tunnelSnap.forEach(doc => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = data.slug || doc.id;
    opt.textContent = `${data.name || "Sans nom"} – (${data.slug || doc.id})`;
    landingDropdown.appendChild(opt);
  });
});

// ➕ Ajouter emails manuels
addManualBtn.addEventListener("click", () => {
  const emails = manualInput.value.split(",").map(e => e.trim()).filter(e => e);
  emails.forEach(email => addToTable(email, "manuel"));
  manualInput.value = "";
});

// ➕ Ajouter email depuis dropdown lead
addLeadBtn.addEventListener("click", () => {
  const selectedEmail = leadDropdown.value;
  if (selectedEmail) {
    addToTable(selectedEmail, "lead");
    leadDropdown.selectedIndex = 0;
  }
});

// ➕ Ajouter tous les leads liés à une landing/tunnel
addLandingBtn.addEventListener("click", async () => {
  const selectedSlug = landingDropdown.value;
  if (!selectedSlug) return;

  console.log("🔗 Landing sélectionné :", selectedSlug);

  const q = query(collection(db, "leads"), where("refId", "==", selectedSlug));
  const snapshot = await getDocs(q);
  console.log("🔍 Leads associés :", snapshot.size);

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.email) addToTable(data.email, selectedSlug);
  });
});

// 💾 Enregistrement final (à adapter selon ton besoin)
saveBtn.addEventListener("click", () => {
  const emails = [];
  table.querySelectorAll("tr").forEach(tr => {
    const email = tr.children[0]?.textContent;
    if (email) emails.push(email);
  });

  if (emails.length === 0) {
    feedback.textContent = "❌ Aucun destinataire sélectionné.";
    return;
  }

  console.log("📨 Emails à enregistrer :", emails);
  feedback.textContent = `✅ ${emails.length} destinataire(s) enregistré(s).`;

  // Ici tu peux stocker les emails sélectionnés dans Firestore ou ailleurs selon ton usage
});
