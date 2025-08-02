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
  getDoc,       // ✅ ajoute ceci
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

   // 🔍 Lecture du voiceUrl depuis le document meta/voice
let voiceUrl = null;
try {
  const metaDoc = await getDoc(doc(db, "scripts", user.uid, "items", id, "meta", "voice"));
  if (metaDoc.exists()) {
    const metaData = metaDoc.data();
    if (metaData.voiceUrl) {
      voiceUrl = metaData.voiceUrl;
    }
  }
} catch (e) {
  console.warn("Erreur lors de la lecture de meta/voice :", e);
}

    // 💡 Construction de la carte
    const card = document.createElement("div");
    card.className = "email-card";
    card.style.display = "flex";
    card.style.justifyContent = "space-between";
    card.style.flexDirection = "row";
    card.style.alignItems = "stretch";
    card.style.gap = "1rem";

    const left = document.createElement("div");
    left.style.flex = "1";
    left.style.display = "flex";
    left.style.flexDirection = "column";
    left.style.gap = "0.5rem";

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.flexDirection = "column";
    right.style.justifyContent = "space-between";
    right.style.alignItems = "flex-end";
    right.style.gap = "0.5rem";

    // Titre
    const title = document.createElement("h3");
    title.textContent = data.title || data.slug || "(sans titre)";
    left.appendChild(title);

    // Boutons gauche
    if (data.url)
      left.appendChild(makeButton("🎬 Voir le script", data.url));
    if (voiceUrl)
      left.appendChild(makeButton("🔊 Écouter la voix off", voiceUrl));
    if (data.videoUrl)
      left.appendChild(makeButton("🎥 Voir la vidéo", data.videoUrl));
    if (data.captionUrl)
      left.appendChild(makeButton("💬 Voir la légende", data.captionUrl));

    // Bouton Export (placeholder)
   const exportBtn = document.createElement("button");
exportBtn.textContent = "📤 Exporter tout";
exportBtn.className = "btn";
exportBtn.onclick = () => {
  alert("Fonction Export à implémenter");
};
left.appendChild(exportBtn);

    // Bouton Assembler
    const assembleBtn = document.createElement("button");
assembleBtn.textContent = "🎞️ Assembler la vidéo";
assembleBtn.className = "assemble-btn"; // 💡 classe spécifique
assembleBtn.onclick = () => {
  window.location.href = `generate-video.html?scriptId=${id}`;
};

    // Bouton Supprimer
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Supprimer les données";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = id;

    right.appendChild(assembleBtn);
    right.appendChild(deleteBtn);

    // Ajout à la carte
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
      e.target.closest(".email-card").remove();
    }
  });
});

function makeButton(text, url, onClick) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.className = "btn";
  if (onClick) {
    btn.onclick = onClick;
  } else if (url) {
    btn.onclick = () => window.open(url, "_blank");
  }
  return btn;
}
