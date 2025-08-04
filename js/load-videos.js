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
const videosList = document.getElementById("videos-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "scripts", user.uid, "items"));
  const querySnapshot = await getDocs(q);

  videosList.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const videoUrl = data.finalVideoUrl;

    if (!videoUrl) return;

    const div = document.createElement("div");
    div.className = "video-card";
    div.style = "background:#222; padding:1rem; margin-bottom:1rem; border-radius:8px;";

    // 🔹 Titre
    const title = document.createElement("h3");
    title.textContent = data.title || "Sans titre";
    title.style = "margin-bottom: 0.5rem;";
    div.appendChild(title);

    // 🔹 Boutons actions (voir, supprimer, exporter)
    const actions = document.createElement("div");
    actions.style = "margin-bottom: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;";

    const viewBtn = document.createElement("a");
    viewBtn.href = videoUrl;
    viewBtn.target = "_blank";
    viewBtn.textContent = "▶️ Voir ma vidéo";
    viewBtn.style = "background:#00ccff; color:black; padding:0.5rem 1rem; border-radius:4px; text-decoration:none;";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Supprimer";
    deleteBtn.style = "background:#cc0000; color:white; padding:0.5rem 1rem; border:none; border-radius:4px;";
    deleteBtn.onclick = async () => {
      if (confirm("Supprimer cette vidéo ?")) {
        await deleteDoc(doc(db, "scripts", user.uid, "items", docSnap.id));
        div.remove();
      }
    };

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "📤 Exporter";
    exportBtn.style = "background:#444; color:white; padding:0.5rem 1rem; border:none; border-radius:4px;";

    actions.appendChild(viewBtn);
    actions.appendChild(deleteBtn);
    actions.appendChild(exportBtn);
    div.appendChild(actions);

    // 🔹 Section export (masquée au départ)
    const exportSection = document.createElement("div");
    exportSection.style = "margin-top:1rem; display:none; background:#111; padding:1rem; border-radius:6px;";
    div.appendChild(exportSection);

    exportBtn.onclick = async () => {
      if (exportSection.style.display === "none") {
        exportSection.style.display = "block";
        exportSection.innerHTML = ""; // reset contenu

        // ▶️ Lien de téléchargement
      const downloadVideoBtn = document.createElement("a");
downloadVideoBtn.href = videoUrl;
downloadVideoBtn.setAttribute("download", ""); // tente forçage
downloadVideoBtn.setAttribute("rel", "noopener");
downloadVideoBtn.setAttribute("target", "_blank"); // évite chargement en plein écran
downloadVideoBtn.textContent = "📥 Télécharger la vidéo finale (.mp4)";
downloadVideoBtn.style = "display:block; margin-bottom:1rem; background:#00ccff; color:black; padding:0.5rem 1rem; border:none; border-radius:4px; text-align:center; text-decoration:none;";
exportSection.appendChild(downloadVideoBtn);
        // 📝 Légende
        const caption = document.createElement("textarea");
        caption.readOnly = true;
        caption.style = "width:100%; margin-bottom:0.5rem;";
        caption.placeholder = "Chargement de la légende...";
        exportSection.appendChild(caption);

        const copyCaption = document.createElement("button");
        copyCaption.textContent = "📋 Copier la légende";
        copyCaption.style = "margin-bottom:1rem;";
        copyCaption.onclick = () => navigator.clipboard.writeText(caption.value);
        exportSection.appendChild(copyCaption);

        // 📺 Titre YouTube
        const titleArea = document.createElement("textarea");
        titleArea.readOnly = true;
        titleArea.style = "width:100%; margin-top:1rem; margin-bottom:0.5rem;";
        titleArea.placeholder = "Chargement du titre...";
        exportSection.appendChild(titleArea);

        const copyTitle = document.createElement("button");
        copyTitle.textContent = "📋 Copier le titre YouTube";
        copyTitle.onclick = () => navigator.clipboard.writeText(titleArea.value);
        exportSection.appendChild(copyTitle);

        // Charger les fichiers texte
        if (data.captionUrl) {
          fetch(data.captionUrl)
            .then((r) => r.text())
            .then((txt) => caption.value = txt)
            .catch(() => caption.value = "[Erreur de chargement]");
        }

        if (data.youtubeTitleUrl) {
          fetch(data.youtubeTitleUrl)
            .then((r) => r.text())
            .then((txt) => titleArea.value = txt)
            .catch(() => titleArea.value = "[Erreur de chargement]");
        }
      } else {
        exportSection.style.display = "none";
      }
    };

    videosList.appendChild(div);
  });
});
