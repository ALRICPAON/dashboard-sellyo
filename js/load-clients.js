import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
let allLeads = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const q = query(collection(db, "leads"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  allLeads = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    allLeads.push({
      ...data,
      id: doc.id,
      createdAt: formatDate(data.createdAt),
    });
  });

  renderTable(allLeads);
});

function renderTable(leads) {
  const tbody = document.getElementById("client-table-body");
  tbody.innerHTML = "";

  if (!leads.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 1rem;">Aucun lead trouvé.</td></tr>`;
    return;
  }

  leads.forEach((lead) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.nom || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.prenom || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.email || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.telephone || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.adresse || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.type || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">${lead.createdAt || ""}</td>
      <td style="padding: 0.8rem; border-top: 1px solid #333;">
        <button onclick="navigator.clipboard.writeText('${lead.email || ""}')" style="background:#00ccff; color:#000; border:none; padding:0.4rem 0.8rem; border-radius:5px; cursor:pointer;">
          Copier l'email
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function formatDate(dateString) {
  if (!dateString || isNaN(Date.parse(dateString))) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR");
}

// 🔍 Filtrage par type
document.getElementById("filter-type").addEventListener("change", (e) => {
  const value = e.target.value;
  const filtered = value ? allLeads.filter(lead => lead.type === value) : allLeads;
  renderTable(filtered);
});

// 📁 Export CSV
document.getElementById("export-csv").addEventListener("click", () => {
  if (!allLeads.length) return;

  const headers = ["Nom", "Prénom", "Email", "Téléphone", "Adresse", "Type", "Date"];
  const rows = allLeads.map(lead => [
    `"${lead.nom || ""}"`,
    `"${lead.prenom || ""}"`,
    `"${lead.email || ""}"`,
    `"${lead.telephone || ""}"`,
    `"${lead.adresse || ""}"`,
    `"${lead.type || ""}"`,
    `"${lead.createdAt || ""}"`
  ]);

  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(",") + "\n"
    + rows.map(row => row.join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "clients-sellyo.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
