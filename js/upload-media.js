import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-init.js";

const storage = getStorage(app);
const auth = getAuth(app);

// 🧪 Upload image avec debug
export async function uploadCoverImage(file, tunnelName) {
  console.log("📦 Simulation upload (debug):", file);

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ Fichier simulé comme uploadé");
      resolve("https://via.placeholder.com/600x400?text=Image+fake");
    }, 500);
  });
}
