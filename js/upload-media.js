import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-init.js";

const storage = getStorage(app);
const auth = getAuth(app);

// ✅ Fonction d’upload d’image de couverture
export async function uploadCoverImage(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const storagePath = `tunnels/${user.uid}/${tunnelName}/cover.jpg`;
  const storageRef = ref(storage, storagePath);

  try {
    console.log("📦 Upload image vers :", storageRef.fullPath);
    console.log("🧪 Fichier reçu pour upload :", file);
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

// ✅ Fonction d’upload de vidéo personnalisée
export async function uploadCustomVideo(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const storagePath = `tunnels/${user.uid}/${tunnelName}/video.mp4`;
  const storageRef = ref(storage, storagePath);

  try {
    console.log("📦 Upload vidéo vers :", storageRef.fullPath);
    const uploadResult = await uploadBytes(storageRef, file);
    console.log("🎥 Upload vidéo réussi :", uploadResult);

    const url = await getDownloadURL(storageRef);
    console.log("🌐 URL de la vidéo :", url);
    return url;
  } catch (error) {
    console.error("❌ Erreur d'upload vidéo :", error);
    throw error;
  }
}
