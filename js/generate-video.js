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
        const res = await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/generateAIVideo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            scriptId: scriptId
          })
        });

        const data = await res.json();
        if (data.success) {
          status.innerText = "✅ Vidéo IA en cours de génération. Cela peut prendre 1 à 2 minutes.";
        } else {
          status.innerText = "❌ Erreur API : " + (data.error || "Erreur inconnue");
        }
      } catch (err) {
        status.innerText = "❌ Échec : " + err.message;
      }
    }

    else {
      status.innerText = "⚠️ Veuillez sélectionner un type de vidéo.";
    }
  });
});
