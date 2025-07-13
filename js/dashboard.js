// ✅ dashboard.js – Affiche le formulaire, les tunnels, et les nouveaux leads avec graphique

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

if (createBtn && formContainer && dashboardContent) {
 createBtn.addEventListener("click", () => {
  document.getElementById("leads-section").style.display = "none"; // 👈 Ajoute cette ligne
  formContainer.style.display = "block";
  dashboardContent.innerHTML = "";
  tunnelsContainer.innerHTML = "";
});
}

if (viewTunnelsBtn && tunnelsContainer) {
  viewTunnelsBtn.addEventListener("click", async () => {
   document.getElementById("leads-section").style.display = "none";
    dashboardContent.innerHTML = "";
    formContainer.style.display = "none";
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

// ➕ Récupérer les leads récents et les afficher dans le graphique et la liste
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  const leadsRef = collection(db, "leads");
  const snapshot = await getDocs(leadsRef);
  const now = new Date();
  const leadsThisWeek = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const created = data.createdAt ? new Date(data.createdAt) : null;
    if (created && (now - created) / (1000 * 60 * 60 * 24) <= 7) {
      leadsThisWeek.push(data);
    }
  });

  // Générer le graphique avec Chart.js
  const dailyCounts = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = d.toLocaleDateString();
    dailyCounts[key] = 0;
  }
  leadsThisWeek.forEach((lead) => {
    const d = new Date(lead.createdAt).toLocaleDateString();
    if (dailyCounts[d] !== undefined) dailyCounts[d]++;
  });

  const ctx = document.getElementById("leadsChart").getContext("2d");
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

  // Liste des noms des leads
  const list = document.getElementById("leadsList");
  leadsThisWeek.forEach((lead) => {
    const li = document.createElement("li");
    const date = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Date inconnue";
const type = lead.type || "n.c.";
const name = lead.nom || lead.email || lead.telephone || "(inconnu)";
li.textContent = `${name} — ${type} — ${date}`;
    list.appendChild(li);
  });
});
