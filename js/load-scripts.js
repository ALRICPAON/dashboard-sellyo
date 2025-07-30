import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const scriptsList = document.getElementById("scripts-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "scripts", user.uid, "items"));
  const querySnapshot = await getDocs(q);
  scriptsList.innerHTML = "";

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;

    const container = document.createElement("div");
    container.className = "script-card";
    container.innerHTML = `
      <h3>${data.title || data.slug || "(sans titre)"}</h3>
      <div class="script-actions">
        ${data.url ? `<button onclick="window.open('${data.url}', '_blank')">🎬 Voir script</button>` : ""}
        ${data.captionUrl ? `<button onclick="window.open('${data.captionUrl}', '_blank')">💬 Voir légende</button>` : ""}
        ${data.youtubeTitleUrl ? `<button onclick="window.open('${data.youtubeTitleUrl}', '_blank')">📺 Voir titre YouTube</button>` : ""}
        
        <button onclick="alert('Exporter à implémenter')">📤 Exporter</button>
        <button onclick="window.location.href='edit-script.html?id=${id}'">✏️ Modifier</button>
        <button onclick="alert('À connecter à Runway ou Sora')">🤖 Générer vidéo</button>
        <button class="delete-btn" data-id="${id}">🧨 Supprimer</button>
      </div>
    `;
    scriptsList.appendChild(container);
  }

  scriptsList.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("delete-btn")) {
      const confirmed = confirm("Supprimer ce script ?");
      if (!confirmed) return;

      await deleteDoc(doc(db, "scripts", user.uid, "items", id));
      e.target.closest(".script-card").remove();
    }
  });
});
