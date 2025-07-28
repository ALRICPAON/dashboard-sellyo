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

  // 🔄 Charger les leads
  const leadsQuery = query(collection(db, "leads"), where("userId", "==", user.uid));
  const leadsSnap = await getDocs(leadsQuery);

  leadsSnap.forEach(doc => {
    const lead = doc.data();
    lead.id = doc.id;
    allLeads.push(lead);
  });

  // 🔄 Afficher les leads
  function renderLeads(leadsToRender) {
    leadsList.innerHTML = "";
    leadDropdown.innerHTML = `<option value="">-- Sélectionner un lead --</option>`;

    leadsToRender.forEach(lead => {
      const label = lead.name ? `${lead.name} (${lead.email})` : lead.email;

      const container = document.createElement("div");
      container.style.marginBottom = "0.5rem";
      container.innerHTML = `
        <label>
          <input type="checkbox" value="${lead.email}" />
          ${label}
        </label>
      `;
      leadsList.appendChild(container);

      const opt = document.createElement("option");
      opt.value = lead.email;
      opt.innerText = label;
      leadDropdown.appendChild(opt);
    });
  }

  // 🔄 Charger tunnels / landings
  const tunnelsQuery = query(collection(db, "tunnels"), where("userId", "==", user.uid));
  const tunnelsSnap = await getDocs(tunnelsQuery);

  tunnelsSnap.forEach(doc => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = data.slug; // 🔑 on utilise slug comme refId
    opt.innerText = `${data.name} (${data.type || "tunnel"})`;
    opt.dataset.type = data.type;
    dropdown.appendChild(opt);
  });

  // 🔁 Filtrage quand contenu sélectionné
  dropdown.addEventListener("change", () => {
    const selectedSlug = dropdown.value;
    if (!selectedSlug) {
      renderLeads(allLeads);
      return;
    }

    const filtered = allLeads.filter(l => l.refId === selectedSlug);
    renderLeads(filtered);
  });

  // 🔘 Initialisation
  renderLeads(allLeads);
});

// 🧠 Auto-cocher un lead sélectionné dans dropdown
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

// 💾 Sauvegarde
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
    await updateDoc(ref, {
      recipients: allRecipients,
      source: {
        type: dropdown.value ? "linkedContent" : (manualEmails.length ? "manual" : "leads"),
        refId: dropdown.value || null
      }
    });
    feedback.innerText = `✅ ${allRecipients.length} destinataire(s) enregistré(s).`;
  } catch (err) {
    feedback.innerText = "❌ Erreur : " + err.message;
  }
});
