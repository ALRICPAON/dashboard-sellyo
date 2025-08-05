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
const iaContainer = document.getElementById("videoia-list");
const facecamContainer = document.getElementById("facecam-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "scripts", user.uid, "items"));
  const querySnapshot = await getDocs(q);

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const id = docSnap.id;

    // 🔍 Lecture du voiceUrl
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

    // 💡 Construction carte
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

    const title = document.createElement("h3");
    title.textContent = data.title || data.slug || "(sans titre)";
    left.appendChild(title);

    // 🎛️ Contenu gauche
    if (data.videoType === "facecam") {
      left.appendChild(makeButton("📤 Réenregistrer ma vidéo", () => {
        window.location.href = `facecam-read.html?scriptId=${id}`;
      }));
    } else {
      if (voiceUrl) left.appendChild(makeButton("🔊 Écouter la voix off", voiceUrl));
      if (data.videoUrl) left.appendChild(makeButton("🎥 Voir la vidéo", data.videoUrl));
    }

    if (data.slug) {
      const captionUrl = `https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${data.slug}-caption.txt`;
      left.appendChild(makeButton("💬 Voir légende & hashtags", captionUrl));
    }

    // 🎞️ Assembler ou Nettoyer
    if (data.videoType === "facecam") {
      const cleanBtn = document.createElement("button");
      cleanBtn.textContent = "🧹 Nettoyer ma vidéo";
      cleanBtn.className = "assemble-btn";
      cleanBtn.onclick = () => {
        window.location.href = `clean-facecam.html?scriptId=${id}`;
      };
      right.appendChild(cleanBtn);
    } else {
      const assembleBtn = document.createElement("button");
      assembleBtn.textContent = "🎞️ Assembler la vidéo";
      assembleBtn.className = "assemble-btn";
      assembleBtn.onclick = () => {
        window.location.href = `generate-video.html?scriptId=${id}`;
      };
      right.appendChild(assembleBtn);
    }

    // 📤 Exporter tout
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

      if (data.slug) {
        await addToZip(`https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${data.slug}-caption.txt`, "caption.txt");
        await addToZip(`https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${data.slug}.srt`, "subtitles.srt");
      }
      if (voiceUrl) await addToZip(voiceUrl, "voice.mp3");
      if (data.videoUrl) await addToZip(data.videoUrl, "video.mp4");

      const safeName = (data.slug || data.title || "script").replace(/[^a-z0-9_\-]/gi, "_");
      zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, `${safeName}.zip`);
      });
    };
    right.appendChild(exportBtn);

    // 🗑️ Supprimer
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Supprimer";
    deleteBtn.className = "delete-btn";
    deleteBtn.dataset.id = id;
    right.appendChild(deleteBtn);

    // Ajout à la bonne colonne
    card.appendChild(left);
    card.appendChild(right);

    if (data.videoType === "facecam") {
      facecamContainer.appendChild(card);
    } else {
      iaContainer.appendChild(card);
    }
  }

  // Suppression
  document.addEventListener("click", async (e) => {
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

function makeButton(text, urlOrFn) {
  const btn = document.createElement("button");
  btn.textContent = text;
  btn.className = "btn";
  if (typeof urlOrFn === "function") {
    btn.onclick = urlOrFn;
  } else {
    btn.onclick = () => window.open(urlOrFn, "_blank");
  }
  return btn;
}

