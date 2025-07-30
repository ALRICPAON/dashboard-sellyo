import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// 🔧 Config Firebase (à adapter si besoin)
import { firebaseConfig } from "./firebase-config.js";
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
    const scriptsRef = collection(db, "scripts", user.uid, "items");
    const snapshot = await getDocs(scriptsRef);

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
          <a href="edit-script.html?id=${doc.id}" style="color: #00c278;">✏️ Voir ou éditer</a>
        </div>
      `);
    });

    listContainer.innerHTML = html.join("");
  } catch (error) {
    console.error("Erreur chargement scripts:", error);
    listContainer.innerHTML = "<p>Erreur lors du chargement des scripts.</p>";
  }
});
