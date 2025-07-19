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
 const selectedOption = dropdown.options[dropdown.selectedIndex];
const selectedType = selectedOption.dataset.type;
const selectedName = selectedOption.dataset.name;

if (!selectedType || !selectedName) {
  renderLeads(allLeads); // tous les leads si rien de sélectionné
  return;
}

const filtered = allLeads.filter(
  l => l.source?.type === selectedType && l.source?.name === selectedName
);

renderLeads(filtered);

if (filtered.length === 0) {
  leadsList.innerHTML = `<p style="color:gray;">Aucun lead trouvé pour ce contenu.</p>`;
}

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
     source: dropdown.selectedIndex > 0
  ? {
      type: dropdown.options[dropdown.selectedIndex].dataset.type,
      name: dropdown.options[dropdown.selectedIndex].dataset.name
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
