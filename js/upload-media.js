import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();
const storage = getStorage();

export async function uploadCoverImage(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  console.log("Début upload image...");
  console.log("Nom du fichier :", file.name);
  console.log("Nom du tunnel :", tunnelName);

  const storagePath = `tunnels/${user.uid}/${tunnelName}/cover.jpg`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadResult = await uploadBytes(storageRef, file);
    console.log("✅ Upload image réussi :", uploadResult);

    const url = await getDownloadURL(storageRef);
    console.log("✅ URL de l'image :", url);
    return url;
  } catch (error) {
    console.error("❌ Erreur d'upload image :", error);
    throw error;
  }
}

export async function uploadCustomVideo(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  console.log("Début upload vidéo...");
  console.log("Nom du fichier :", file.name);
  console.log("Nom du tunnel :", tunnelName);

  const storagePath = `tunnels/${user.uid}/${tunnelName}/video.mp4`;
  const storageRef = ref(storage, storagePath);

  try {
    const uploadResult = await uploadBytes(storageRef, file);
    console.log("🎥 Upload vidéo réussi :", uploadResult);

    const url = await getDownloadURL(storageRef);
    console.log("🎥 URL de la vidéo :", url);
    return url;
  } catch (error) {
    console.error("❌ Erreur d'upload vidéo :", error);
    throw error;
  }
}
