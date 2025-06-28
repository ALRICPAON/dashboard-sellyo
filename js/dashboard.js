// ✅ dashboard.js – Affiche le formulaire ou les tunnels de l'utilisateur

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");
const tunnelsContainer = document.getElementById("tunnels-by-type");
const viewTunnelsBtn = document.getElementById("view-tunnels");

if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    tunnelsContainer.innerHTML = "";
    console.log("✅ Formulaire principal affiché !");
  });
}

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

      querySnapshot.forEach((doc) => {
        const data = doc.data();
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

        tunnels.forEach((tunnel) => {
          const card = document.createElement("div");
          card.style.padding = "1rem";
          card.style.background = "#1e1e1e";
          card.style.borderRadius = "10px";
          card.style.marginBottom = "0.5rem";

          const link = `https://cdn.sellyo.fr/${type}/${tunnel.folder}/${tunnel.slug}.html`;
          card.innerHTML = `
            <strong>${tunnel.name}</strong><br>
            <small>${tunnel.createdAt}</small><br>
            <a href="${link}" target="_blank" style="color:#00ccff; text-decoration:underline">Voir la page</a>
          `;
          block.appendChild(card);
        });

        tunnelsContainer.appendChild(block);
      }
    });
  });
}
