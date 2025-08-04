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

    if (videoUrl) {
      const div = document.createElement("div");
      div.className = "video-card";
      div.style = "background:#222; padding:1rem; margin-bottom:1rem; border-radius:8px;";

      const title = document.createElement("h3");
      title.textContent = data.title || "Sans titre";
      title.style = "margin-bottom: 0.5rem;";

      const viewBtn = document.createElement("a");
      viewBtn.href = videoUrl;
      viewBtn.target = "_blank";
      viewBtn.textContent = "▶️ Voir ma vidéo";
      viewBtn.style = "margin-right:1rem; background:#00ccff; color:black; padding:0.5rem 1rem; border-radius:4px; text-decoration:none;";

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
      exportBtn.style = "margin-left:1rem; background:#444; color:white; padding:0.5rem 1rem; border:none; border-radius:4px;";
      
      const exportSection = document.createElement("div");
      exportSection.style = "margin-top:1rem; display:none; background:#111; padding:1rem; border-radius:6px;";
      
      exportBtn.onclick = async () => {
        if (exportSection.style.display === "none") {
          exportSection.style.display = "block";

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

          const title = document.createElement("textarea");
          title.readOnly = true;
          title.style = "width:100%; margin-top:1rem; margin-bottom:0.5rem;";
          title.placeholder = "Chargement du titre...";
          exportSection.appendChild(title);

          const copyTitle = document.createElement("button");
          copyTitle.textContent = "📋 Copier le titre YouTube";
          copyTitle.onclick = () => navigator.clipboard.writeText(title.value);
          exportSection.appendChild(copyTitle);

          // Charger le contenu des fichiers texte
          if (data.captionUrl) {
            fetch(data.captionUrl)
              .then((r) => r.text())
              .then((txt) => caption.value = txt)
              .catch(() => caption.value = "[Erreur de chargement]");
          }

          if (data.youtubeTitleUrl) {
            fetch(data.youtubeTitleUrl)
              .then((r) => r.text())
              .then((txt) => title.value = txt)
              .catch(() => title.value = "[Erreur de chargement]");
          }
        } else {
          exportSection.style.display = "none";
        }
      };

      div.appendChild(exportBtn);
      div.appendChild(exportSection);

      div.appendChild(title);
      div.appendChild(viewBtn);
      div.appendChild(deleteBtn);
      videosList.appendChild(div);
    }
  });
});
