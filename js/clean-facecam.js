import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const statusEl = document.getElementById("status");

// ⬇️ URL Cloud Run (celle que tu viens de déployer)
const CLEAN_URL = "https://clean-facecam-465249279278.europe-west1.run.app/clean";

// Récupérer scriptId de l’URL
const params = new URLSearchParams(window.location.search);
const scriptId = params.get("scriptId");

if (!scriptId) {
  alert("Aucun script sélectionné.");
  window.location.href = "mes-videos.html";
}

statusEl.textContent = "Vérification du script…";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vous devez être connecté.");
    window.location.href = "index.html";
    return;
  }

  try {
    const ref = doc(db, "scripts", user.uid, "items", scriptId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Script introuvable.");
      window.location.href = "mes-videos.html";
      return;
    }
    const data = snap.data();
    if (!data.facecamRawUrl) {
      alert("Aucune vidéo brute trouvée. Uploade d'abord ta vidéo FaceCam.");
      window.location.href = `facecam-read.html?scriptId=${scriptId}`;
      return;
    }

    statusEl.textContent = "Nettoyage en cours (silences)…";
    const res = await fetch(CLEAN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.uid, scriptId })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      console.error("Clean error:", json);
      throw new Error(json?.message || "Échec du nettoyage.");
    }

    statusEl.textContent = "✅ Terminé. Redirection…";
    setTimeout(() => {
      window.location.href = "mes-videos.html";
    }, 1200);
  } catch (err) {
    console.error(err);
    alert("Erreur lors du nettoyage de la vidéo.");
    statusEl.textContent = "❌ Erreur.";
  }
});
