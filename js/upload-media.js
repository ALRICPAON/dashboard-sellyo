import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-init.js";

const storage = getStorage(app);
const auth = getAuth(app);

export async function uploadCoverImage(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const storagePath = `test-cover.jpg`; // pour test simple
  const storageRef = ref(storage, storagePath);

  try {
    console.log("📦 Upload vers :", storageRef.fullPath);
    const uploadResult = await uploadBytes(storageRef, file);
    console.log("✅ Upload image réussi :", uploadResult);

    const url = await getDownloadURL(storageRef);
    console.log("🌐 URL de l'image :", url);
    return url;
  } catch (error) {
    console.error("❌ Erreur d'upload image :", error);
    throw error;
  }
}
