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

// URL de ton service Cloud Run
const CLOUD_RUN_URL = "https://assemble-video-465249279278.europe-west1.run.app";

// Récupération de l'ID du script
const urlParams = new URLSearchParams(window.location.search);
const scriptId = urlParams.get("scriptId");

onAuthStateChanged(auth, async (user) => {
  if (!user || !scriptId) {
    alert("Non autorisé");
    window.location.href = "index.html";
    return;
  }

  try {
    const docRef = doc(db, "scripts", user.uid, "items", scriptId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Script introuvable");

    const data = docSnap.data();

    // 🔗 On reconstruit les URLs
    const videoUrl = data.videoUrl;
    const subtitleUrl = data.slug
      ? `https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${data.slug}.srt`
      : null;

    console.log("🎯 subtitleUrl:", subtitleUrl);

    // 🔗 Lecture de la voix off depuis meta/voice
    let voiceUrl = null;
    const metaDoc = await getDoc(doc(db, "scripts", user.uid, "items", scriptId, "meta", "voice"));
    if (metaDoc.exists()) {
      voiceUrl = metaDoc.data().voiceUrl;
    }

    if (!videoUrl || !voiceUrl) {
      alert("Vidéo ou voix manquante.");
      return;
    }

    // Appel à la fonction Cloud Run
    const res = await fetch(CLOUD_RUN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.uid,
        docId: scriptId,
        videoUrl,
        voiceUrl,
        subtitleUrl
      })
    });

    const result = await res.json();

    if (res.ok && result.finalVideoUrl) {
      document.getElementById("status").innerText = "✅ Vidéo prête ! Redirection vers votre bibliothèque...";
      setTimeout(() => {
        window.location.href = "mes-videos.html";
      }, 2000);
    } else {
      throw new Error(result.error || "Erreur inconnue");
    }

  } catch (err) {
    console.error("❌ Erreur lors de l’assemblage :", err);
    alert("Erreur : " + err.message);
  }
});
