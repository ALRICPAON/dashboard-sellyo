import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const params = new URLSearchParams(window.location.search);
const emailId = params.get("id");
const fileInput = document.getElementById("file-input");
const form = document.getElementById("upload-form");
const statusText = document.getElementById("status");

if (!emailId) {
  statusText.textContent = "❌ ID de l'email manquant dans l’URL.";
  throw new Error("ID de l'email manquant.");
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return;

    const storageRef = ref(storage, `email-attachments/${user.uid}/${emailId}/${file.name}`);

    try {
      statusText.textContent = "⏳ Upload en cours...";
      await uploadBytes(storageRef, file);

      const fileURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "emails", emailId), {
        fileURL: fileURL,
        fileName: file.name
      });

      statusText.innerHTML = `✅ Fichier joint ajouté avec succès !<br><a href="${fileURL}" target="_blank" style="color:lime;">📎 Voir le fichier</a>`;
    } catch (err) {
      statusText.textContent = "❌ Erreur d’upload : " + err.message;
    }
  });
});
