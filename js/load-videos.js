import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const container = document.getElementById("videos-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "scripts", user.uid, "items"));
  const querySnapshot = await getDocs(q);
  container.innerHTML = "";

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const slug = data.slug || docSnap.id;

    if (!slug || !data.captionUrl || !data.youtubeTitleUrl) continue;

    const finalVideoUrl = `https://firebasestorage.googleapis.com/v0/b/sellyo-3bbdb.appspot.com/o/scripts%2F${user.uid}%2F${slug}%2Ffinal.mp4?alt=media`;

    const card = document.createElement("div");
    card.className = "video-card";
    card.style =
      "display:flex; justify-content:space-between; align-items:start; padding:1rem; border:1px solid #333; border-radius:8px; margin-bottom:1rem; background:#181818; color:white;";

    const left = document.createElement("div");
    left.style = "flex:1;";

    const title = document.createElement("h3");
    title.textContent = data.title || slug;
    title.style = "margin-bottom:0.5rem;";
    left.appendChild(title);

    const viewBtn = document.createElement("a");
    viewBtn.href = finalVideoUrl;
    viewBtn.target = "_blank";
    viewBtn.textContent = "🎞️ Voir la vidéo finale";
    viewBtn.className = "medium-button";
    viewBtn.style = "display:inline-block; margin-right:0.5rem;";
    left.appendChild(viewBtn);

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "📤 Exporter";
    exportBtn.className = "medium-button";
    exportBtn.style = "margin-top:0.5rem;";

    const exportSection = createExportSection(
      finalVideoUrl,
      data.captionUrl,
      data.youtubeTitleUrl
    );

    exportBtn.addEventListener("click", () => {
      exportSection.style.display =
        exportSection.style.display === "none" ? "block" : "none";
    });

    left.appendChild(exportBtn);
    left.appendChild(exportSection);

    const right = document.createElement("div");
    right.style = "min-width:150px; text-align:right;";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Supprimer";
    deleteBtn.className = "small-button red-button";
    deleteBtn.style = "margin-top:0.5rem;";
    deleteBtn.addEventListener("click", async () => {
      if (confirm("Supprimer cette vidéo ?")) {
        await deleteDoc(doc(db, "scripts", user.uid, "items", slug));
        location.reload();
      }
    });

    right.appendChild(deleteBtn);

    card.appendChild(left);
    card.appendChild(right);
    container.appendChild(card);
  }
});

function createExportSection(videoUrl, captionUrl, youtubeTitleUrl) {
  const container = document.createElement("div");
  container.className = "export-section";
  container.style =
    "background:#1c1c1c; padding:1rem; margin-top:1rem; border-radius:8px; display:none;";

  const downloadLink = document.createElement("a");
  downloadLink.href = videoUrl;
  downloadLink.textContent = "📥 Télécharger la vidéo finale (.mp4)";
  downloadLink.target = "_blank";
  downloadLink.style =
    "display:block; margin-bottom:1rem; color:#00ccff; font-weight:bold;";

  const captionTitle = document.createElement("p");
  captionTitle.textContent = "📝 Légende à copier :";

  const captionArea = document.createElement("textarea");
  captionArea.style = "width:100%; margin-bottom:0.5rem;";
  captionArea.readOnly = true;

  const copyCaptionBtn = document.createElement("button");
  copyCaptionBtn.textContent = "📋 Copier la légende";
  copyCaptionBtn.className = "small-button";
  copyCaptionBtn.style = "margin-bottom:1rem;";
  copyCaptionBtn.onclick = () =>
    navigator.clipboard.writeText(captionArea.value);

  const ytTitle = document.createElement("p");
  ytTitle.textContent = "📺 Titre YouTube :";

  const ytTitleArea = document.createElement("textarea");
  ytTitleArea.style = "width:100%; margin-bottom:0.5rem;";
  ytTitleArea.readOnly = true;

  const copyTitleBtn = document.createElement("button");
  copyTitleBtn.textContent = "📋 Copier le titre";
  copyTitleBtn.className = "small-button";
  copyTitleBtn.onclick = () =>
    navigator.clipboard.writeText(ytTitleArea.value);

  // Charger les fichiers texte
  if (captionUrl) {
    fetch(captionUrl)
      .then((r) => r.text())
      .then((txt) => (captionArea.value = txt));
  }

  if (youtubeTitleUrl) {
    fetch(youtubeTitleUrl)
      .then((r) => r.text())
      .then((txt) => (ytTitleArea.value = txt));
  }

  container.appendChild(downloadLink);
  container.appendChild(captionTitle);
  container.appendChild(captionArea);
  container.appendChild(copyCaptionBtn);
  container.appendChild(ytTitle);
  container.appendChild(ytTitleArea);
  container.appendChild(copyTitleBtn);

  return container;
}
