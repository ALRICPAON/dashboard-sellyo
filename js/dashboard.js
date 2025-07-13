// ✅ dashboard.js – Affiche le formulaire, les tunnels, les leads et les clients avec filtre et export CSV

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const filterType = document.getElementById("filter-type");
const exportCsvBtn = document.getElementById("export-csv");

let allLeads = [];

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
    dashboardContent.innerHTML = "";
    formContainer.style.display = "none";
    clientListSection.style.display = "none";
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

if (viewClientsBtn && clientListSection && clientListContainer) {
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
      allLeads = snapshot.docs.map(docSnap => docSnap.data());
      renderClientTable(allLeads);
    });
  });
}

if (filterType) {
  filterType.addEventListener("change", () => {
    const type = filterType.value;
    const filtered = type ? allLeads.filter(l => l.type === type) : allLeads;
    renderClientTable(filtered);
  });
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    const rows = ["Nom,Email,Téléphone,Type,Date"];
    const filtered = filterType.value ? allLeads.filter(l => l.type === filterType.value) : allLeads;
    filtered.forEach(l => {
      const nom = l.nom || "";
      const email = l.email || "";
      const tel = l.telephone || "";
      const type = l.type || "";
      const date = l.createdAt?.toDate ? l.createdAt.toDate().toLocaleDateString() : new Date(l.createdAt).toLocaleDateString();
      rows.push(`${nom},${email},${tel},${type},${date}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

function renderClientTable(leads) {
  let html = `
    <table style="width:100%; border-collapse: collapse; font-size: 16px; color: white;">
      <thead>
        <tr style="background:#333;">
          <th style="padding: 12px 16px;">Prénom</th>
          <th style="padding: 12px 16px;">Nom / Email</th>
          <th style="padding: 12px 16px;">Téléphone</th>
          <th style="padding: 12px 16px;">Type</th>
          <th style="padding: 12px 16px;">Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  leads.forEach((lead) => {
    const prenom = lead.prenom || "-";
    const nom = lead.nom || lead.email || "-";
    const tel = lead.telephone || "-";
    const type = lead.type || "-";
    const date = lead.createdAt?.toDate ? lead.createdAt.toDate().toLocaleDateString() : new Date(lead.createdAt).toLocaleDateString();

    html += `
      <tr style="border-bottom:1px solid #444;">
        <td style="padding: 12px 16px;">${prenom}</td>
        <td style="padding: 12px 16px;">${nom}</td>
        <td style="padding: 12px 16px;">${tel}</td>
        <td style="padding: 12px 16px; text-transform: capitalize;">${type}</td>
        <td style="padding: 12px 16px;">${date}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  clientListContainer.innerHTML = html;
}

// ✅ Graphique + liste leads récents
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const q = query(collection(db, "leads"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);
  const now = new Date();
  const leadsThisWeek = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    let createdAt = data.createdAt;
    if (createdAt?.toDate) createdAt = createdAt.toDate();
    else createdAt = new Date(createdAt);

    if (createdAt instanceof Date && !isNaN(createdAt)) {
      const daysAgo = (now - createdAt) / (1000 * 60 * 60 * 24);
      if (daysAgo <= 7) {
        leadsThisWeek.push({ ...data, createdAt });
      }
    }
  });

  const dailyCounts = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toLocaleDateString();
    dailyCounts[key] = 0;
  }

  leadsThisWeek.forEach((lead) => {
    const d = lead.createdAt.toLocaleDateString();
    if (dailyCounts[d] !== undefined) dailyCounts[d]++;
  });

  const ctx = document.getElementById("leadsChart")?.getContext("2d");
  if (ctx) {
    new Chart(ctx, {
      type: "line",
      data: {
        labels: Object.keys(dailyCounts),
        datasets: [{
          label: "Nouveaux leads",
          data: Object.values(dailyCounts),
          borderColor: "#00ccff",
          tension: 0.3,
        }]
      },
      options: {
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  const list = document.getElementById("leadsList");
  if (list) {
    list.innerHTML = "";
    leadsThisWeek.forEach((lead) => {
      const li = document.createElement("li");
      const date = lead.createdAt.toLocaleDateString();
      const type = lead.type || "n.c.";
      const name = lead.nom || lead.email || lead.telephone || "(inconnu)";
      li.textContent = `${name} — ${type} — ${date}`;
      list.appendChild(li);
    });
  }
});
