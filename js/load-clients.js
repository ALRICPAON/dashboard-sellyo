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
      id: doc.id
    });
  });

  renderLeads(allLeads);
});

function renderLeads(leads) {
  const container = document.getElementById("client-list");
  container.innerHTML = "";

  if (!leads.length) {
    container.innerHTML = "<p>Aucun lead trouvé.</p>";
    return;
  }

  leads.forEach((lead) => {
    const div = document.createElement("div");
    div.style.background = "#2b2b2b";
    div.style.padding = "1rem";
    div.style.marginBottom = "1rem";
    div.style.borderRadius = "8px";

    div.innerHTML = `
      <strong>${lead.name || "Client anonyme"}</strong><br>
      Email : ${lead.email || "non fourni"}<br>
      Type : ${lead.type || "-"}<br>
      Page liée : <a href="${lead.pageUrl || '#'}" target="_blank" style="color: #00ccff;">voir</a>
    `;

    container.appendChild(div);
  });
}

// 🎯 Filtrer selon le type
document.getElementById("filter-type").addEventListener("change", (e) => {
  const value = e.target.value;
  const filtered = value ? allLeads.filter(lead => lead.type === value) : allLeads;
  renderLeads(filtered);
});

// 📁 Exporter en CSV
document.getElementById("export-csv").addEventListener("click", () => {
  if (!allLeads.length) return;

  const headers = ["Nom", "Email", "Type", "URL"];
  const rows = allLeads.map(lead => [
    `"${lead.name || ""}"`,
    `"${lead.email || ""}"`,
    `"${lead.type || ""}"`,
    `"${lead.pageUrl || ""}"`
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
