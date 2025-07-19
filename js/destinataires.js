const leadsList = document.getElementById("leads-list");
const dropdown = document.getElementById("link-content");

// 🔄 Charger les leads
const leadsQuery = query(collection(db, "leads"), where("userId", "==", user.uid));
const leadsSnap = await getDocs(leadsQuery);

let allLeads = [];
leadsSnap.forEach(doc => {
  const lead = doc.data();
  lead.id = doc.id;
  allLeads.push(lead);
});

function renderLeads(leadsToRender) {
  leadsList.innerHTML = "";
  leadsToRender.forEach(lead => {
    const container = document.createElement("div");
    container.style.marginBottom = "0.5rem";

    const label = `${lead.name || "-"} (${lead.email}) [${lead?.source?.name || "-"}]`;
    container.innerHTML = `
      <label>
        <input type="checkbox" value="${lead.email}" />
        ${label}
      </label>
    `;
    leadsList.appendChild(container);
  });
}

// 🔄 Charger les contenus associés (landings ou tunnels)
const tunnelsQuery = query(collection(db, "tunnels"), where("userId", "==", user.uid));
const tunnelsSnap = await getDocs(tunnelsQuery);

tunnelsSnap.forEach(doc => {
  const data = doc.data();
  const opt = document.createElement("option");
opt.value = data.name;
opt.innerText = `${data.name} (${data.type || "tunnel"})`;
opt.dataset.type = data.type;
opt.dataset.name = data.name;
dropdown.appendChild(opt);
});

// 🔄 Filtrer les leads selon contenu sélectionné
dropdown.addEventListener("change", () => {
  const selectedId = dropdown.value;
  if (!selectedId) {
    renderLeads(allLeads); // tous les leads
    return;
  }
  const filtered = allLeads.filter(l => l.source?.refId === selectedId);
  renderLeads(filtered);
});

// 👀 Rendu initial (tous les leads)
renderLeads(allLeads);

// 🔘 Enregistrement des leads cochés
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
