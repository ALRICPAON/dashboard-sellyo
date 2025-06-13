import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-init.js";

// Initialisation Firebase
const storage = getStorage(app);
const auth = getAuth(app);

// ✅ Fonction simulée pour l'image
export async function uploadCoverImage(file, tunnelName) {
  console.log("📦 Simulation upload image (debug):", file);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ Fichier image simulé comme uploadé");
      resolve("https://via.placeholder.com/600x400?text=Image+fake");
    }, 500);
  });
}

// ✅ Fonction simulée pour la vidéo
export async function uploadCustomVideo(file, tunnelName) {
  console.log("🎥 Simulation upload vidéo (debug):", file);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ Vidéo simulée comme uploadée");
      resolve("https://via.placeholder.com/600x400?text=Vidéo+fake");
    }, 500);
  });
}
