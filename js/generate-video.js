import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth(app);

// 🎯 Affichage des options selon le type sélectionné
document.getElementById("videoType").addEventListener("change", function () {
  const type = this.value;
  document.getElementById("facecam-options").style.display = type === "facecam" ? "block" : "none";
  document.getElementById("avatar-options").style.display = type === "avatar" ? "block" : "none";
  document.getElementById("aigen-options").style.display = type === "aigen" ? "block" : "none";
});

// 🚀 Lancer la génération vidéo selon le type
document.getElementById("generateVideoBtn").addEventListener("click", async () => {
  const type = document.getElementById("videoType").value;
  const status = document.getElementById("generationStatus");
  status.innerText = "⏳ Traitement en cours...";

  const scriptId = new URLSearchParams(window.location.search).get("scriptId");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      status.innerText = "❌ Erreur : utilisateur non connecté.";
      return;
    }

    const uid = user.uid;

    if (type === "facecam") {
      const file = document.getElementById("facecamFile").files[0];
      if (!file) {
        status.innerText = "⚠️ Veuillez choisir une vidéo.";
        return;
      }
      // TODO : implémenter handleFacecamUpload(file)
      status.innerText = "📤 Upload face cam non encore implémenté.";
    }

    else if (type === "avatar") {
      const voice = document.getElementById("avatarVoice").value;
      const avatarId = document.getElementById("avatarId").value;
      // TODO : implémenter generateAvatar()
      status.innerText = "🤖 Avatar IA non encore implémenté.";
    }

    else if (type === "aigen") {
      try {
        const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js");
        const functions = getFunctions(app);
        const generateImageFromPrompt = httpsCallable(functions, "generateImageFromPrompt");

        const result = await generateImageFromPrompt({
          userId: uid,
          scriptId: scriptId
        });

        if (result.data.success) {
          status.innerText = "✅ Image IA générée avec succès (Job ID : " + result.data.runwayJobId + ")";
        } else {
          status.innerText = "❌ Erreur lors de la génération de l'image.";
        }

      } catch (err) {
        console.error("Erreur Cloud Function :", err);
        status.innerText = "❌ Échec de la génération : " + err.message;
      }
    }

    else {
      status.innerText = "⚠️ Veuillez sélectionner un type de vidéo.";
    }
  });
});
