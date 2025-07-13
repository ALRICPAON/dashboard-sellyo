import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");
const tunnelsContainer = document.getElementById("tunnels-by-type");
const viewTunnelsBtn = document.getElementById("view-tunnels");
const viewClientsBtn = document.getElementById("view-clients");
const clientListSection = document.getElementById("client-list-section");
const clientListContainer = document.getElementById("client-list");
const filterTypeSelect = document.getElementById("filter-type");
const exportCsvBtn = document.getElementById("export-csv");

let allLeads = []; // Stocker tous les leads pour filtrage et export

// ➕ Tunnels
if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    document.getElementById("leads-section").style.display = "none";
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    tunnelsContainer.innerHTML = "";
    clientListSection.style.display = "none";
  });
}

if (viewTunnelsBtn && tunnelsContainer) {
  viewTunnelsBtn.addEventListener("click", async () => {
    document.getElementById("leads-section").style.display = "none";
    formContainer.style.display = "none";
    clientListSection.style.display = "none";
    dashboardContent.innerHTML = "";
    tunnelsContainer.innerHTML = "Chargement...";

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const q = query(collection(db, "tunnels"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const tunnelsByType = { complet: [], landing: [], email: [], video: [] };
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        data.id = docSnap.id;
        const type = data.type || "autre";
        if (tunnelsByType[type]) tunnelsByType[type].push(data);
      });

      tunnelsContainer.innerHTML = "";
      for (const [type, tunnels] of Object.entries(tunnelsByType)) {
        if (tunnels.length === 0) continue;
        const block = document.createElement("div");
        block.innerHTML = `<h3 style="margin-bottom: 0.5rem; text-transform: capitalize">${type}</h3>`;
        const grid = document.createElement("div");
        grid.className = "tunnel-grid";

        tunnels.forEach((tunnel) => {
          const card = document.createElement("div");
          card.className = "tunnel-card";
          const finalLink = tunnel.pageUrl || `https://cdn.sellyo.fr/${type}/${tunnel.folder}/${tunnel.slug}.html`;

          card.innerHTML = `
            <h3>${tunnel.name}</h3>
            <p><small>${tunnel.createdAt || ''}</small></p>
            <a href="${finalLink}" target="_blank">Voir la page</a>
            <input type="text" value="${finalLink}" readonly style="margin-top: 0.5rem; background: #333; color: #fff; border: none; width: 100%; padding: 0.3rem; border-radius: 6px;">
            <button class="copy-btn">Copier le lien</button>
            <button class="delete-btn">Supprimer</button>
          `;

          card.querySelector(".copy-btn").addEventListener("click", () => {
            navigator.clipboard.writeText(finalLink);
            card.querySelector(".copy-btn").textContent = "✅ Copié !";
            setTimeout(() => card.querySelector(".copy-btn").textContent = "Copier le lien", 1500);
          });

          card.querySelector(".delete-btn").addEventListener("click", async () => {
            if (confirm(`Supprimer le tunnel "${tunnel.name}" ?`)) {
              try {
                await deleteDoc(doc(db, "tunnels", tunnel.id));
                card.remove();
              } catch (err) {
                console.error("Erreur de suppression :", err);
                alert("Échec de la suppression.");
              }
            }
          });

          grid.appendChild(card);
        });

        block.appendChild(grid);
        tunnelsContainer.appendChild(block);
      }
    });
  });
}

// ➕ Clients
if (viewClientsBtn && clientListSection) {
  viewClientsBtn.addEventListener("click", async () => {
    document.getElementById("leads-section").style.display = "none";
    formContainer.style.display = "none";
    tunnelsContainer.innerHTML = "";
    dashboardContent.innerHTML = "";
    clientListSection.style.display = "block";
    clientListContainer.innerHTML = "Chargement...";

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const q = query(collection(db, "leads"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      allLeads = [];

      snapshot.forEach(docSnap => {
        const lead = docSnap.data();
        allLeads.push({
          nom: lead.nom || "-",
          email: lead.email || "-",
          tel: lead.telephone || "-",
          type: lead.type || "-",
          date: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "-"
        });
      });

      renderLeadsTable(allLeads);
    });
  });
}

// ➕ Affichage du tableau filtré
function renderLeadsTable(leads) {
  let html = `<table style="width:100%; border-collapse: collapse; color: white;">
    <thead><tr><th style="padding: 0.5rem; text-align:left;">Nom</th><th>Email</th><th>Téléphone</th><th>Type</th><th>Date</th></tr></thead><tbody>`;
  leads.forEach(lead => {
    html += `<tr>
      <td style="padding: 0.5rem;">${lead.nom}</td>
      <td>${lead.email}</td>
      <td>${lead.tel}</td>
      <td>${lead.type}</td>
      <td>${lead.date}</td>
    </tr>`;
  });
  html += "</tbody></table>";
  clientListContainer.innerHTML = html;
}

// ➕ Filtrage par type
if (filterTypeSelect) {
  filterTypeSelect.addEventListener("change", () => {
    const value = filterTypeSelect.value;
    if (!value) {
      renderLeadsTable(allLeads);
    } else {
      const filtered = allLeads.filter(lead => lead.type === value);
      renderLeadsTable(filtered);
    }
  });
}

// ➕ Export CSV
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    const type = filterTypeSelect.value;
    const filteredLeads = type ? allLeads.filter(lead => lead.type === type) : allLeads;

    const csvContent = "data:text/csv;charset=utf-8," + [
      ["Nom", "Email", "Téléphone", "Type", "Date"],
      ...filteredLeads.map(lead => [lead.nom, lead.email, lead.tel, lead.type, lead.date])
    ].map(e => e.join(";")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clients_${type || "tous"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
