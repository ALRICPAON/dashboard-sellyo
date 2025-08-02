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
  getDoc,
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
      console.warn("Erreur lecture voiceUrl:", e);
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
    right.style.alignItems = "flex-end";
    right.style.gap = "0.5rem";
    right.style.justifyContent = "flex-start";

    // Titre
    const title = document.createElement("h3");
    title.textContent = data.title || data.slug || "(sans titre)";
    left.appendChild(title);

    // Boutons (gauche)
    if (data.url) left.appendChild(makeButton("🎬 Voir le script", data.url));
    if (voiceUrl) left.appendChild(makeButton("🔊 Écouter la voix off", voiceUrl));
    if (data.videoUrl) left.appendChild(makeButton("🎥 Voir la vidéo", data.videoUrl));
    if (data.captionUrl) left.appendChild(makeButton("💬 Voir la légende", data.captionUrl));

    // Bouton Assembler
    const assembleBtn = document.createElement("button");
    assembleBtn.textContent = "🎞️ Assembler la vidéo";
    assembleBtn.className = "assemble-btn";
    assembleBtn.onclick = () => {
      window.location.href = `generate-video.html?scriptId=${id}`;
    };
    right.appendChild(assembleBtn);

    // Bouton Export (dans colonne de droite sous assembler)
    const exportBtn = document.createElement("button");
    exportBtn.textContent = "📤 Exporter tout";
    exportBtn.className = "btn";
   exportBtn.onclick = async () => {
  const zip = new JSZip();

  async function addToZip(url, filename) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur téléchargement : ${filename}`);
      const blob = await response.blob();
      zip.file(filename, blob);
    } catch (e) {
      console.warn("⚠️ Échec export fichier :", filename, e);
    }
  }

  // Relecture dynamique du voiceUrl (au moment du clic)
  let freshVoiceUrl = null;
  try {
    const metaDoc = await getDoc(doc(db, "scripts", user.uid, "items", id, "meta", "voice"));
    if (metaDoc.exists()) {
      const metaData = metaDoc.data();
      if (metaData.voiceUrl) {
        freshVoiceUrl = metaData.voiceUrl;
      }
    }
  } catch (e) {
    console.warn("Erreur relecture voiceUrl dans export :", e);
  }

  // Ajout des fichiers
  if (data.url) await addToZip(data.url, "script.html");
  if (freshVoiceUrl) await addToZip(freshVoiceUrl, "voice.mp3");
  if (data.videoUrl) await addToZip(data.videoUrl, "video.mp4");
  if (data.captionUrl) await addToZip(data.captionUrl, "caption.txt");

  // Téléchargement ZIP
  const safeName = (data.slug || data.title || "script").replace(/[^a-z0-9_\-]/gi, "_");
  zip.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, `${safeName}.zip`);
  });
};

    right.appendChild(exportBtn);

    // Bouton Supprimer (petit rouge)
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Supprimer les données";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = id;
    right.appendChild(deleteBtn);

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
