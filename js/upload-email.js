import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
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
    const files = fileInput.files;
    if (!files.length) return;

    statusText.innerHTML = "⏳ Upload en cours...<br>";

    const uploadedLinks = [];

    for (const file of files) {
      const storageRef = ref(storage, `email-attachments/${user.uid}/${emailId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const fileURL = await getDownloadURL(storageRef);
      uploadedLinks.push({ name: file.name, url: fileURL });
    }

    // 🔁 Sauvegarde dans Firestore en liste (array)
    const docRef = doc(db, "emails", emailId);
    await updateDoc(docRef, {
      attachments: arrayUnion(...uploadedLinks)
    });

    // ✅ Message
    statusText.innerHTML = `<span style="color:limegreen;">✅ ${uploadedLinks.length} fichier(s) ajouté(s) avec succès !</span><br><br>` +
      uploadedLinks.map(f => `📎 <a href="${f.url}" target="_blank">${f.name}</a>`).join("<br>");
  });
});
