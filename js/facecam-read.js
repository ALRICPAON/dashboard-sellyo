import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Récupérer l'ID du script depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const scriptId = urlParams.get("scriptId");

if (!scriptId) {
  alert("Aucun script sélectionné.");
  window.location.href = "scripts.html";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vous devez être connecté.");
    window.location.href = "index.html";
    return;
  }

  try {
    const docRef = doc(db, "scripts", user.uid, "items", scriptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      alert("Script introuvable.");
      window.location.href = "scripts.html";
      return;
    }

    const data = docSnap.data();
    const captionUrl = data.captionUrl;

    if (!captionUrl) {
      document.getElementById("script-text").textContent = "Aucun script trouvé.";
      return;
    }

    const res = await fetch(captionUrl);
    const text = await res.text();
    document.getElementById("script-text").textContent = text;

    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("video-file");
    const statusMsg = document.getElementById("upload-status");

    uploadBtn.addEventListener("click", async () => {
      const file = fileInput.files[0];
      if (!file) {
        alert("Veuillez sélectionner une vidéo.");
        return;
      }

      uploadBtn.disabled = true;
      uploadBtn.textContent = "⏳ Envoi en cours...";
      statusMsg.textContent = "";

      try {
        const storageRef = ref(storage, `scripts/${user.uid}/${scriptId}/facecam-raw.mp4`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await updateDoc(docRef, {
          facecamRawUrl: url,
          status: "uploaded"
        });

        statusMsg.textContent = "✅ Vidéo envoyée avec succès. Redirection...";
        setTimeout(() => {
          window.location.href = "mes-videos.html";
        }, 1500);

      } catch (err) {
        console.error("Erreur upload :", err);
        alert("Erreur lors de l'envoi de la vidéo.");
        uploadBtn.disabled = false;
        uploadBtn.textContent = "✅ Envoyer ma vidéo";
      }
    });

  } catch (err) {
    console.error("Erreur chargement script :", err);
    alert("Erreur lors du chargement du script.");
  }
});
