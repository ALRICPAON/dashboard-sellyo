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
    const hashtags = Array.isArray(data.hashtags) ? data.hashtags.join(" ") : "";
    const url = data.url || "#";

    const container = document.createElement("div");
    container.className = "script-card";
    container.style = "border: 1px solid #444; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; background-color: #1c1c1c;";

    container.innerHTML = `
      <h3 style="margin: 0 0 0.5rem 0;">🎬 ${data.title || "Script sans titre"}</h3>
      <p><strong>🎯 Objectif :</strong> ${data.goal || "-"}</p>
      <p><strong>👥 Audience :</strong> ${data.audience || "-"}</p>
      <p><strong>🎞️ Type de vidéo :</strong> ${data.videoType || "-"}</p>
      <p><strong>📝 Description :</strong> ${data.description || "-"}</p>
      <p><strong>🧠 Légende :</strong> ${data.caption || "Aucune"}</p>
      <p><strong>🧷 Hashtags :</strong> ${hashtags || "Aucun"}</p>
      <p><strong>📎 Lien GitHub :</strong> <a href="${url}" target="_blank" style="color:#00c278;">Voir le fichier</a></p>

      <div class="script-actions" style="margin-top: 1rem;">
        <button class="view-btn" data-url="${url}">📽️ Voir</button>
        <button class="edit-btn" data-id="${id}">✏️ Modifier</button>
        <button class="delete-btn" data-id="${id}">🗑️ Supprimer</button>
        <button class="generate-btn" data-id="${id}">🧠 Générer la vidéo</button>
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

    if (e.target.classList.contains("edit-btn")) {
      window.location.href = `edit-script.html?id=${id}`;
    }

    if (e.target.classList.contains("generate-btn")) {
      alert("🧠 Cette fonctionnalité sera bientôt disponible !");
    }

    if (e.target.classList.contains("delete-btn")) {
      const confirmDelete = confirm("Supprimer ce script ?");
      if (!confirmDelete) return;
      await deleteDoc(doc(db, "scripts", auth.currentUser.uid, "items", id));
      e.target.closest(".script-card").remove();
    }
  });
});
