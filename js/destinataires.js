// destinataires.js
import { app } from "./firebase-init.js";
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

let allLeads = [];

function renderLeads(leadsToRender) {
  leadsList.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.style.border = "1px solid #333";
  wrapper.style.background = "#1c1c1c";
  wrapper.style.padding = "1rem";
  wrapper.style.borderRadius = "10px";
  wrapper.style.marginTop = "1rem";

  const title = document.createElement("h3");
  title.innerText = "📩 Leads disponibles";
  title.style.marginBottom = "1rem";
  title.style.color = "#00ccff";
  wrapper.appendChild(title);

  if (leadsToRender.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.style.color = "gray";
    emptyMsg.innerText = "Aucun lead trouvé.";
    wrapper.appendChild(emptyMsg);
  } else {
    leadsToRender.forEach(lead => {
      const label = `${lead.name || "-"} (${lead.email}) [${lead?.source?.name || "-"})]`;
      const container = document.createElement("div");
      container.style.marginBottom = "0.5rem";
      container.innerHTML = `
        <label>
          <input type="checkbox" value="${lead.email}" />
          ${label}
        </label>
      `;
      wrapper.appendChild(container);
    });
  }

  leadsList.appendChild(wrapper);
}

onAuthStateChanged(auth, async (user) => {
  if (!user || !emailId) {
    window.location.href = "index.html";
    return;
  }

  // 🔄 Charger les leads
  const leadsQuery = query(collection(db, "leads"), where("userId", "==", user.uid));
  const leadsSnap = await getDocs(leadsQuery);
  allLeads = [];
  leadsSnap.forEach(doc => {
    const lead = doc.data();
    lead.id = doc.id;
    allLeads.push(lead);
  });
  console.log("📬 Leads chargés :", allLeads);

  // 🔄 Charger les contenus associés (tunnels/landings)
  const tunnelsQuery = query(collection(db, "tunnels"), where("userId", "==", user.uid));
  const tunnelsSnap = await getDocs(tunnelsQuery);

  tunnelsSnap.forEach(doc => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = data.slug; // ← utilisé comme refId dans les leads
    opt.innerText = `${data.name || data.slug} (${data.type || "tunnel"})`;
    opt.dataset.type = data.type;
    opt.dataset.slug = data.slug;
    dropdown.appendChild(opt);
  });

  console.log("📂 Tunnels/landings chargés :", tunnelsSnap.docs.map(d => d.data()));

  // 👀 Rendu initial
  renderLeads(allLeads);

  // 🔄 Filtrer les leads selon contenu sélectionné
  dropdown.addEventListener("change", () => {
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const selectedType = selectedOption.dataset.type;
    const selectedSlug = selectedOption.dataset.slug;

    if (!selectedType || !selectedSlug) {
      renderLeads(allLeads);
      return;
    }

    const filtered = allLeads.filter(
      l => l.refId === selectedSlug && l.type === selectedType
    );

    renderLeads(filtered);
  });

  // 💾 Sauvegarde des destinataires
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
      const selectedOption = dropdown.options[dropdown.selectedIndex];

      const ref = doc(db, "emails", emailId);
      await updateDoc(ref, {
        recipients: allRecipients,
        source: dropdown.selectedIndex > 0
          ? {
              type: selectedOption.dataset.type,
              name: selectedOption.textContent.trim()
            }
          : manualEmails.length > 0
            ? { type: "manual" }
            : { type: "leads" }
      });
      feedback.innerText = `✅ ${allRecipients.length} destinataire(s) enregistré(s).`;
    } catch (err) {
      feedback.innerText = "❌ Erreur : " + err.message;
    }
  });
});
