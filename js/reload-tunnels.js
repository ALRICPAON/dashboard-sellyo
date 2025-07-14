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
    if (!user) return;

    const q = query(collection(db, "tunnels"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    tunnelsContainer.innerHTML = "";

    snapshot.forEach((doc) => {
      const tunnel = doc.data();
      const card = document.createElement("div");
      card.style.background = "#222";
      card.style.padding = "1rem";
      card.style.borderRadius = "10px";
      card.innerHTML = `
        <h3>${tunnel.name || "Tunnel"}</h3>
        <p>${tunnel.goal || ""}</p>
        <a href="${tunnel.pageUrl}" target="_blank" style="color: #00ccff;">Voir la page</a>
      `;
      tunnelsContainer.appendChild(card);
    });
  });
}
