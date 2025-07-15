import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

export async function reloadTunnels() {
  const tunnelsContainer = document.getElementById("tunnels-by-type");
  if (!tunnelsContainer) return;

  tunnelsContainer.innerHTML = "Chargement...";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      tunnelsContainer.innerHTML = "Vous n'êtes pas connecté.";
      return;
    }

    try {
      const q = query(collection(db, "tunnels"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        tunnelsContainer.innerHTML = "<p>Aucun tunnel généré pour le moment.</p>";
        return;
      }

      tunnelsContainer.innerHTML = "";

      snapshot.forEach((doc) => {
        const tunnel = doc.data();

        const card = document.createElement("div");
        card.style.background = "#1c1c1c";
        card.style.padding = "1.5rem";
        card.style.borderRadius = "10px";
        card.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
        card.style.transition = "transform 0.2s ease";
        card.style.cursor = "default";

        card.onmouseover = () => (card.style.transform = "scale(1.02)");
        card.onmouseleave = () => (card.style.transform = "scale(1)");

        card.innerHTML = `
          <h3 style="margin: 0 0 0.5rem 0; color: #00ccff;">${tunnel.name || "Tunnel"}</h3>
          <p style="margin: 0 0 0.5rem 0;"><strong>Objectif :</strong> ${tunnel.goal || "-"}</p>
          <p style="margin: 0 0 1rem 0;"><strong>Type :</strong> <span style="background:#333; color:#fff; padding: 0.2rem 0.6rem; border-radius: 5px;">${tunnel.type || "-"}</span></p>
          <button onclick="navigator.clipboard.writeText('${tunnel.pageUrl || ""}')" style="background:#00ccff; color:#000; border:none; padding:0.5rem 1rem; border-radius: 6px; cursor:pointer;">
            📎 Copier l'URL
          </button>
        `;

        tunnelsContainer.appendChild(card);
      });
    } catch (err) {
      console.error("❌ Erreur lors du chargement :", err);
      tunnelsContainer.innerHTML = `<p style="color:red;">Erreur de chargement des tunnels.</p>`;
    }
  });
}

// 🟢 Exécute au chargement de la page
reloadTunnels();
