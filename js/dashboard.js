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
const form = document.getElementById("tunnel-form");
const tunnelType = document.getElementById("tunnel-type");
const formFields = document.getElementById("form-content-fields");

// Loader HTML ajouté dynamiquement
const loader = document.createElement("div");
loader.innerHTML = "<div style='text-align:center; margin-top:20px;'><span style='display:inline-block; border:4px solid #ccc; border-top:4px solid #00ccff; border-radius:50%; width:30px; height:30px; animation: spin 1s linear infinite;'></span></div>";

const loaderStyle = document.createElement("style");
loaderStyle.textContent = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.head.appendChild(loaderStyle);

// Affiche le formulaire
if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    tunnelsContainer.innerHTML = "";
    console.log("✅ Formulaire principal affiché !");
  });
}

// Supprime le champ URL de paiement si "landing" sélectionné
if (tunnelType) {
  tunnelType.addEventListener("change", () => {
    if (tunnelType.value === "landing") {
      const paymentField = document.querySelector("#form-content-fields input[type='url']");
      if (paymentField && paymentField.parentElement) {
        paymentField.parentElement.remove();
      }
    }
  });
}

// Affiche les tunnels existants
if (viewTunnelsBtn && tunnelsContainer) {
  viewTunnelsBtn.addEventListener("click", async () => {
    dashboardContent.innerHTML = "";
    formContainer.style.display = "none";
    tunnelsContainer.innerHTML = "";
    tunnelsContainer.appendChild(loader);

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
        data.id = docSnap.id;
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

          const copyBtn = card.querySelector(".copy-btn");
          copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(finalLink);
            copyBtn.textContent = "✅ Copié !";
            setTimeout(() => copyBtn.textContent = "Copier le lien", 1500);
          });

          const deleteBtn = card.querySelector(".delete-btn");
          deleteBtn.addEventListener("click", async () => {
            const confirmed = confirm(`Supprimer le tunnel \"${tunnel.name}\" ?`);
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
