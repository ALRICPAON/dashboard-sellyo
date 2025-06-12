import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Ton vrai bucket
const bucketURL = "gs://sellyo-3bbdb.firebasestorage.app";

export async function uploadCoverImage(file, tunnelName) {
  const auth = getAuth();
  const storage = getStorage();

  const storageRef = ref(storage, `${bucketURL}/tunnels/${auth.currentUser.uid}/${tunnelName}/cover.jpg`);

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

export async function uploadCustomVideo(file, tunnelName) {
  const auth = getAuth();
  const storage = getStorage();
  const user = auth.currentUser;

  if (!user) throw new Error("Utilisateur non connecté");

  const storagePath = `${bucketURL}/tunnels/${user.uid}/${tunnelName}/video.mp4`;
  const storageRef = ref(storage, storagePath);

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
