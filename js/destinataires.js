console.log("✅ Script destinataires.js bien chargé");

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

document.addEventListener("DOMContentLoaded", () => {
  const addManualBtn = document.getElementById("add-manual");
  const manualInput = document.getElementById("manual-emails");
  const leadDropdown = document.getElementById("lead-dropdown");
  const landingDropdown = document.getElementById("link-content");
  const addLeadBtn = document.getElementById("add-lead");
  const addLandingBtn = document.getElementById("add-from-content");
  const saveBtn = document.getElementById("save-manual");
  const table = document.querySelector("#recipients-table tbody");
  const feedback = document.getElementById("feedback");

  const auth = getAuth(app);
  const db = getFirestore(app);
  const selectedRecipients = new Set();

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

  onAuthStateChanged(auth, async (user) => {
    if (!user) return (window.location.href = "login.html");
    const userId = user.uid;

    const q = query(collection(db, "leads"), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    leads.forEach(lead => {
      const opt = document.createElement("option");
      opt.value = lead.email;
      opt.textContent = `${lead.nom || ""} ${lead.prenom || ""} (${lead.email})`;
      leadDropdown.appendChild(opt);
    });

    const tunnels = await getDocs(query(collection(db, "tunnels"), where("userId", "==", userId)));
    tunnels.forEach(doc => {
      const data = doc.data();
      const opt = document.createElement("option");
      opt.value = data.slug || doc.id;
      opt.textContent = `${data.name || "Sans nom"} – (${data.slug || doc.id})`;
      landingDropdown.appendChild(opt);
    });
  });

  addManualBtn.addEventListener("click", () => {
    const emails = manualInput.value.split(",").map(e => e.trim()).filter(e => e);
    emails.forEach(email => addToTable(email, "manuel"));
    manualInput.value = "";
  });

  addLeadBtn.addEventListener("click", () => {
    const selectedEmail = leadDropdown.value;
    if (selectedEmail) {
      addToTable(selectedEmail, "lead");
      leadDropdown.selectedIndex = 0;
    }
  });

  addLandingBtn.addEventListener("click", async () => {
    const selectedSlug = landingDropdown.value;
    if (!selectedSlug) return;
    console.log("🔗 Landing sélectionné :", selectedSlug);

    const q = query(collection(db, "leads"), where("source.refId", "==", selectedSlug));
    const snapshot = await getDocs(q);
    console.log("🔍 Leads associés :", snapshot.size);

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) addToTable(data.email, selectedSlug);
    });
  });

  saveBtn.addEventListener("click", async () => {
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

    // 🔁 Lire l'emailId dans l'URL (ex: ?emailId=abc123)
const urlParams = new URLSearchParams(window.location.search);
const emailId = urlParams.get("emailId");

if (!emailId) {
  feedback.textContent = "❌ Erreur : emailId introuvable.";
  return;
}

const user = auth.currentUser;

if (!user) {
  feedback.textContent = "❌ Utilisateur non connecté.";
  return;
}

// 📤 Mise à jour du champ recipients dans Firestore
try {
  const emailDocRef = doc(db, "emails", user.uid, "items", emailId);
  await updateDoc(emailDocRef, {
    recipients: emails  // ✅ tableau ["email1", "email2", ...]
  });

  console.log("✅ Destinataires bien enregistrés :", emails);
  feedback.textContent = `✅ ${emails.length} destinataire(s) enregistrés dans l’email.`;
} catch (err) {
  console.error("🔥 Erreur Firestore :", err);
  feedback.textContent = "❌ Erreur lors de l’enregistrement des destinataires.";
}

  });
});
