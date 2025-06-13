import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { app } from "./firebase-init.js";

const storage = getStorage(app);
const auth = getAuth(app);

// 🧪 Upload image avec debug
export async function uploadCoverImage(file, tunnelName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Utilisateur non connecté");

  console.log("📦 Fichier reçu :", file);

  const path = `tunnels/${user.uid}/${tunnelName}/cover.jpg`;
  const storageRef = ref(storage, path);

  const metadata = {
    contentType: file.type || "image/jpeg",
  };

  try {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📤 Progression : ${progress.toFixed(0)}%`);
        },
        (error) => {
          console.error("❌ Erreur upload :", error);
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("✅ Upload terminé. URL :", url);
          resolve(url);
        }
      );
    });
  } catch (e) {
    console.error("❌ Exception upload :", e);
    throw e;
  }
}
