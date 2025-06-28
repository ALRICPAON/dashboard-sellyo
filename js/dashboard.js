// ✅ dashboard.js – Affiche le formulaire ou les tunnels de l'utilisateur

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

// Affiche le formulaire
if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    tunnelsContainer.innerHTML = "";
    console.log("✅ Formulaire principal affiché !");
  });
}

// Affiche les tunnels existants
if (viewTunnelsBtn && tunnelsContainer) {
  viewTunnelsBtn.addEventListener("click", async () => {
    dashboardContent.innerHTML = "";
    formContainer.style.display = "none";
    tunnelsContainer.innerHTML = "Chargement...";

    onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const q = query(collection(db, "tunnels"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      const tunnelsByType = {
        complet: [],
        landing: [],
        email: [],
        video: []
      };

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        data.id = docSnap.id; // Ajout de l'ID Firestore
        const type = data.type || "autre";
        if (tunnelsByType[type]) {
          tunnelsByType[type].push(data);
        }
      });

      tunnelsContainer.innerHTML = "";

      for (const [type, tunnels] of Object.entries(tunnelsByType)) {
        if (tunnels.length === 0) continue;

        const block = document.createElement("div");
        block.innerHTML = `<h3 style="margin-bottom: 0.5rem; text-transform: capitalize">${type}</h3>`;

        const grid = document.createElement("div");
        grid.className = "tunnel-grid"; // Pour CSS 4 colonnes

        tunnels.forEach((tunnel) => {
          const card = document.createElement("div");
          card.className = "tunnel-card";

          const link = `https://cdn.sellyo.fr/${type}/${tunnel.folder}/${tunnel.slug}.html`;

          card.innerHTML = `
            <h3>${tunnel.name}</h3>
            <p><small>${tunnel.createdAt || ''}</small></p>
            <a href="${link}" target="_blank">Voir la page</a>
            <input type="text" value="${link}" readonly style="margin-top: 0.5rem; background: #333; color: #fff; border: none; width: 100%; padding: 0.3rem; border-radius: 6px;">
            <button class="copy-btn">Copier le lien</button>
            <button class="delete-btn">Supprimer</button>
          `;

          // Copier le lien
          const copyBtn = card.querySelector(".copy-btn");
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(link);
            copyBtn.textContent = "✅ Copié !";
            setTimeout(() => copyBtn.textContent = "Copier le lien", 1500);
          });

          // Supprimer le tunnel
          const deleteBtn = card.querySelector(".delete-btn");
          deleteBtn.addEventListener("click", async () => {
            const confirmed = confirm(`Supprimer le tunnel "${tunnel.name}" ?`);
            if (!confirmed) return;

            try {
              await deleteDoc(doc(db, "tunnels", tunnel.id));
              card.remove();
            } catch (err) {
              console.error("Erreur de suppression :", err);
              alert("Échec de la suppression.");
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
