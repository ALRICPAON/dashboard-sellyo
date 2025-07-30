import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const list = document.getElementById("scripts-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const scriptsRef = collection(doc(db, "scripts", user.uid), "items");
  const snapshot = await getDocs(scriptsRef);
  list.innerHTML = "";

  if (snapshot.empty) {
    list.innerHTML = "<p>Aucun script généré pour le moment.</p>";
    return;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const url = data.url || "#";

    const container = document.createElement("div");
    container.className = "script-card";
    container.style = "border: 1px solid #444; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; background-color: #1c1c1c;";

    container.innerHTML = `
      <h3 style="margin: 0 0 1rem 0;">🎬 ${data.title || "(sans titre)"}</h3>

      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        <button class="view-btn" data-url="${url}">📽️ Voir</button>
        <button class="copy-btn" data-url="${url}">🔗 Copier le lien</button>
        <button class="export-btn" data-url="${url}">📤 Exporter</button>
        <button class="edit-btn" data-id="${id}">✏️ Modifier</button>
        <button class="generate-btn" data-id="${id}">🧠 Générer la vidéo</button>
        <button class="delete-btn" data-id="${id}">🗑️ Supprimer</button>
      </div>
    `;

    list.appendChild(container);
  });

  list.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    const url = e.target.dataset.url;

    if (e.target.classList.contains("view-btn")) {
      if (!url || url === "#") return alert("Aucun lien disponible.");
      window.open(url, "_blank");
    }

    if (e.target.classList.contains("copy-btn")) {
      await navigator.clipboard.writeText(url);
      alert("🔗 Lien copié dans le presse-papiers !");
    }

    if (e.target.classList.contains("export-btn")) {
      alert("📤 Fonction Exporter à venir !");
    }

    if (e.target.classList.contains("edit-btn")) {
      window.location.href = `edit-script.html?id=${id}`;
    }

    if (e.target.classList.contains("generate-btn")) {
      alert("🧠 Génération vidéo à venir !");
    }

    if (e.target.classList.contains("delete-btn")) {
      const confirmDelete = confirm("Supprimer ce script ?");
      if (!confirmDelete) return;
      await deleteDoc(doc(db, "scripts", auth.currentUser.uid, "items", id));
      e.target.closest(".script-card").remove();
    }
  });
});
