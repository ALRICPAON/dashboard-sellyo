import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-init.js"; // ← Importe ton app Firebase existante

const storage = getStorage(app);
const auth = getAuth(app);

// Fonction d’upload d’image de couverture
export async function uploadCoverImage(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const storageRef = ref(storage, `tunnels/${user.uid}/${tunnelName}/cover.jpg`);

  try {
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

// Fonction d’upload de vidéo personnalisée
export async function uploadCustomVideo(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  const storageRef = ref(storage, `tunnels/${user.uid}/${tunnelName}/video.mp4`);

  try {
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
