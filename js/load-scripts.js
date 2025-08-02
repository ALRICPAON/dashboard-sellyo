import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
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

    const card = document.createElement("div");
    card.className = "script-card";
    card.style = `
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      background: #222;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      padding: 1rem;
    `;

    const left = document.createElement("div");
    left.style = "flex: 1; display: flex; flex-direction: column; gap: 0.5rem;";

    const right = document.createElement("div");
    right.style = "display: flex; flex-direction: column; justify-content: space-between; gap: 0.5rem; text-align: right;";

    // 👉 Côté gauche – boutons de visualisation/export
    if (data.url)
      left.appendChild(makeButton("🎬 Voir le script", data.url));
    if (data.voiceUrl)
      left.appendChild(makeButton("🔊 Écouter la voix off", data.voiceUrl));
    if (data.videoUrl)
      left.appendChild(makeButton("🎥 Voir la vidéo", data.videoUrl));
    if (data.captionUrl)
      left.appendChild(makeButton("💬 Voir la légende", data.captionUrl));

    // Boutons export (même si pas encore implémentés)
    left.appendChild(makeButton("📤 Exporter tout", null, () => {
      alert("Fonction Export à implémenter");
    }));

    // 👉 Côté droit – assembler & supprimer
    const assembleBtn = document.createElement("button");
    assembleBtn.textContent = "🎞️ Assembler la vidéo";
    assembleBtn.style = "padding: 0.6rem 1rem; font-weight: bold;";
    assembleBtn.onclick = () => {
      window.location.href = `generate-video.html?scriptId=${id}`;
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Supprimer les données";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = id;
    deleteBtn.style = "background-color: #822; color: white;";

    right.appendChild(assembleBtn);
    right.appendChild(deleteBtn);

    // Assemblage de la carte
    card.appendChild(left);
    card.appendChild(right);
    scriptsList.appendChild(card);
  }

  // Suppression
  scriptsList.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("delete-btn")) {
      const confirmed = confirm("Supprimer ce script ?");
      if (!confirmed) return;

      await deleteDoc(doc(db, "scripts", auth.currentUser.uid, "items", id));
      e.target.closest(".script-card").remove();
    }
  });
});

function makeButton(text, url, onClick) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.style = "text-align: left;";
  if (onClick) {
    btn.onclick = onClick;
  } else if (url) {
    btn.onclick = () => window.open(url, "_blank");
  }
  return btn;
}
