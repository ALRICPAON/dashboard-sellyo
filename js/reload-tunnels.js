import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

      types.forEach(type => {
        columns[type] = [];
      });

      snapshot.forEach(doc => {
        const tunnel = doc.data();
        const type = tunnel.type === "complet" ? "complet" : tunnel.type;
        columns[type]?.push(tunnel);
      });

      // Grille d'affichage
      const grid = document.createElement("div");
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gap = "1.5rem";

      types.forEach(type => {
        const col = document.createElement("div");
        col.style.background = "#1a1a1a";
        col.style.padding = "1rem";
        col.style.borderRadius = "10px";

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

          card.innerHTML = `
            <strong>${tunnel.name || "Tunnel"}</strong><br>
            <small>${tunnel.goal || ""}</small><br><br>
            <button onclick="navigator.clipboard.writeText('${tunnel.pageUrl || ""}')" style="background:#00ccff; color:#000; border:none; padding:0.4rem 0.8rem; border-radius:5px; cursor:pointer; margin-right:0.5rem;">
              📎 Copier l'URL
            </button>
            <a href="${tunnel.pageUrl}" target="_blank" style="background:#333; color:#fff; text-decoration:none; padding:0.4rem 0.8rem; border-radius:5px;">
              🔗 Voir la page
            </a>
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

// Lance au chargement
reloadTunnels();
