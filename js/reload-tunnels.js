import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

export async function reloadTunnels() {
  const container = document.getElementById("tunnels-by-type");
  if (!container) return;

  container.innerHTML = "Chargement...";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      container.innerHTML = "Non connecté.";
      return;
    }

    try {
      const q = query(collection(db, "tunnels"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        container.innerHTML = "<p>Aucun tunnel trouvé.</p>";
        return;
      }

      container.innerHTML = "";

      const types = ["landing", "email", "video", "complet"];
      const typeLabels = {
        landing: "Landing",
        email: "Email",
        video: "Vidéo",
        complet: "Tunnel"
      };

      const columns = {};
      types.forEach(type => columns[type] = []);

      snapshot.forEach(docSnap => {
        const tunnel = docSnap.data();
        tunnel.id = docSnap.id; // Ajout de l'ID pour suppression
        const type = tunnel.type === "complet" ? "complet" : tunnel.type;
        columns[type]?.push(tunnel);
      });

      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gap = "1.5rem";
      grid.style.margin = "0 auto";
      grid.style.maxWidth = "1300px";

      types.forEach(type => {
        const col = document.createElement("div");
        col.style.background = "#1a1a1a";
        col.style.padding = "1rem";
        col.style.borderRadius = "10px";
        col.style.flex = "1";
        col.style.minWidth = "260px";
        col.style.maxWidth = "300px";
        col.style.display = "flex";
        col.style.flexDirection = "column";
        col.style.alignItems = "center";

        const title = document.createElement("h3");
        title.textContent = typeLabels[type];
        title.style.color = "#00ccff";
        title.style.borderBottom = "1px solid #333";
        title.style.paddingBottom = "0.5rem";
        col.appendChild(title);

        columns[type].forEach(tunnel => {
          const card = document.createElement("div");
          card.style.background = "#222";
          card.style.marginTop = "1rem";
          card.style.padding = "1rem";
          card.style.borderRadius = "8px";
          card.style.boxShadow = "0 0 6px rgba(0,0,0,0.3)";
          card.style.maxWidth = "280px";
          card.style.width = "100%";

          const name = tunnel.name || "Tunnel";
          const goal = tunnel.goal || "";
          const url = tunnel.pageUrl || "";

          card.innerHTML = `
            <strong>${name}</strong><br>
            <small>${goal}</small><br><br>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <button onclick="navigator.clipboard.writeText('${url}')" style="background:#00ccff; color:#000; border:none; padding:0.4rem 0.8rem; border-radius:5px; cursor:pointer;">
                📎 Copier l'URL
              </button>
              <a href="${url}" target="_blank" style="background:#333; color:#fff; text-decoration:none; padding:0.4rem 0.8rem; border-radius:5px; text-align:center;">
                🔗 Voir la page
              </a>
              <button onclick="deleteTunnel('${tunnel.id}')" style="background:#ff4444; color:#fff; border:none; padding:0.4rem 0.8rem; border-radius:5px; cursor:pointer;">
                🗑️ Supprimer
              </button>
            </div>
          `;
          col.appendChild(card);
        });

        grid.appendChild(col);
      });

      container.appendChild(grid);
    } catch (err) {
      console.error("Erreur tunnels:", err);
      container.innerHTML = "<p style='color:red;'>Erreur de chargement des tunnels.</p>";
    }
  });
}

// Fonction de suppression
window.deleteTunnel = async function(id) {
  const confirmation = confirm("Voulez-vous vraiment supprimer ce tunnel ?");
  if (!confirmation) return;

  try {
    await deleteDoc(doc(db, "tunnels", id));
    alert("Tunnel supprimé.");
    reloadTunnels(); // Recharge la liste
  } catch (error) {
    console.error("Erreur suppression :", error);
    alert("Échec de la suppression.");
  }
};

reloadTunnels();
