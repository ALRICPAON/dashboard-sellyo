import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js"; // ou "./firebase-init.js" si tu centralises

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const listContainer = document.getElementById("scripts-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    listContainer.innerHTML = "<p>Veuillez vous connecter pour voir vos scripts.</p>";
    return;
  }

  try {
    // ✅ Chemin correct : scripts/{uid}/items
    const parentRef = doc(db, "scripts", user.uid);
    const itemsRef = collection(parentRef, "items");
    const snapshot = await getDocs(itemsRef);

    if (snapshot.empty) {
      listContainer.innerHTML = "<p>Aucun script pour l’instant. Créez-en un pour commencer.</p>";
      return;
    }

    const html = [];
    snapshot.forEach((doc) => {
      const s = doc.data();
      html.push(`
        <div style="border: 1px solid #444; padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
          <h3 style="margin: 0 0 0.5rem 0;">${s.title || "Script sans titre"}</h3>
          <p style="color: #ccc;">${s.description?.substring(0, 200) || "Aucune description disponible"}...</p>
          <a href="${s.url}" target="_blank" style="color: #00c278;">▶️ Voir le script</a>
        </div>
      `);
    });

    listContainer.innerHTML = html.join("");
  } catch (error) {
    console.error("Erreur chargement scripts:", error);
    listContainer.innerHTML = "<p>Erreur lors du chargement des scripts.</p>";
  }
});
