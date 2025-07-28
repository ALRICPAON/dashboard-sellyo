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
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const emailId = new URLSearchParams(window.location.search).get("id");
const textarea = document.getElementById("manual-emails");
const saveBtn = document.getElementById("save-manual");
const feedback = document.getElementById("feedback");
const leadsList = document.getElementById("leads-list");
const dropdown = document.getElementById("link-content");
const leadDropdown = document.getElementById("lead-dropdown");

let allLeads = [];

onAuthStateChanged(auth, async (user) => {
  if (!user || !emailId) {
    window.location.href = "index.html";
    return;
  }

  console.log("✅ Utilisateur connecté :", user.uid);

  // 🔄 Charger tous les leads de l'utilisateur
  const leadsQuery = query(collection(db, "leads"), where("userId", "==", user.uid));
  const leadsSnap = await getDocs(leadsQuery);

  allLeads = leadsSnap.docs.map(doc => {
    const data = doc.data();
    data.id = doc.id;
    return data;
  });

  console.log("📦 Leads récupérés :", allLeads.length);

  // 🔄 Charger les tunnels et landings
  const tunnelsQuery = query(collection(db, "tunnels"), where("userId", "==", user.uid));
  const tunnelsSnap = await getDocs(tunnelsQuery);

  tunnelsSnap.forEach(doc => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = data.slug || doc.id; // 🧠 On utilise slug si dispo
    opt.innerText = `${data.name} (${data.type || "tunnel"})`;
    opt.dataset.type = data.type;
    dropdown.appendChild(opt);
  });

  // 🎯 Affichage initial de tous les leads
  renderLeads(allLeads);

  // 🔁 Quand on change de tunnel/landing
  dropdown.addEventListener("change", () => {
    const selectedId = dropdown.value;
    console.log("🔗 Tunnel ou landing sélectionné :", selectedId);

    if (!selectedId) {
      renderLeads(allLeads);
      return;
    }

    const filtered = allLeads.filter(l => {
      const leadRefId = l.source?.refId || l.refId;
      const match = leadRefId === selectedId;
      console.log(`🔍 Comparaison lead ${l.email} → refId = ${leadRefId} → match = ${match}`);
      return match;
    });

    console.log("🎯 Leads filtrés :", filtered.length);
    renderLeads(filtered);
  });

  // 🎨 Fonction d'affichage des leads
  function renderLeads(leadsToRender) {
    leadsList.innerHTML = "";
    leadDropdown.innerHTML = `<option value="">-- Sélectionner un lead --</option>`;

    leadsToRender.forEach(lead => {
      const label = lead.name
        ? `${lead.name} (${lead.email})`
        : lead.email;

      const container = document.createElement("div");
      container.style.marginBottom = "0.5rem";
      container.innerHTML = `
        <label>
          <input type="checkbox" value="${lead.email}" />
          ${label}
        </label>
      `;
      leadsList.appendChild(container);

      // Ajouter aussi à la dropdown
      const opt = document.createElement("option");
      opt.value = lead.email;
      opt.innerText = label;
      leadDropdown.appendChild(opt);
    });
  }

  // ✅ Enregistrement des destinataires
  saveBtn.addEventListener("click", async () => {
    const raw = textarea.value;
    const manualEmails = raw.split(",").map(e => e.trim()).filter(e => e.includes("@"));
    const checkedEmails = [...leadsList.querySelectorAll("input[type='checkbox']:checked")].map(e => e.value);
    const allRecipients = [...new Set([...manualEmails, ...checkedEmails])];

    if (allRecipients.length === 0) {
      feedback.innerText = "❌ Aucun destinataire sélectionné.";
      return;
    }

    try {
      const ref = doc(db, "emails", emailId);
      const selectedRef = dropdown.value || null;
      const type = selectedRef ? "linkedContent" : (manualEmails.length ? "manual" : "leads");

      console.log("📤 Enregistrement destinataires :", allRecipients);
      console.log("🔗 Type association :", type, "→ refId:", selectedRef);

      await updateDoc(ref, {
        recipients: allRecipients,
        source: {
          type,
          refId: selectedRef
        }
      });

      feedback.innerText = `✅ ${allRecipients.length} destinataire(s) enregistré(s).`;
    } catch (err) {
      console.error("❌ Erreur Firestore :", err);
      feedback.innerText = "❌ Erreur : " + err.message;
    }
  });

  // 🆕 Sélectionner un lead → cocher dans la liste
  leadDropdown.addEventListener("change", () => {
    const selectedEmail = leadDropdown.value;
    if (!selectedEmail) return;

    const checkbox = [...leadsList.querySelectorAll("input[type='checkbox']")]
      .find(cb => cb.value === selectedEmail);

    if (checkbox) {
      checkbox.checked = true;
      checkbox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
});
