import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const params = new URLSearchParams(window.location.search);
const emailId = params.get("id");
const fileInput = document.getElementById("file-input");
const form = document.getElementById("upload-form");
const statusText = document.getElementById("status");
const attachmentsList = document.getElementById("attachments-list");

if (!emailId) {
  statusText.textContent = "❌ ID email manquant dans l’URL.";
  throw new Error("ID email requis.");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const emailRef = doc(db, "emails", emailId);

  // 🧾 Affiche la liste des fichiers existants
  async function renderAttachments() {
    const snap = await getDoc(emailRef);
    const data = snap.data();
    const attachments = data.attachments || [];

    if (!attachments.length) {
      attachmentsList.innerHTML = "<p>Aucun fichier joint pour l’instant.</p>";
      return;
    }

    attachmentsList.innerHTML = "<h3>📎 Fichiers déjà envoyés :</h3>";

    attachments.forEach(file => {
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.gap = "10px";
      div.style.marginBottom = "8px";

      const link = document.createElement("a");
      link.href = file.url;
      link.textContent = file.name;
      link.target = "_blank";

      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.style = "background:red;color:white;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;";
      delBtn.onclick = async () => {
        const confirmed = confirm(`Supprimer : ${file.name} ?`);
        if (!confirmed) return;

        const storagePath = `email-attachments/${user.uid}/${emailId}/${file.name}`;
        await deleteObject(ref(storage, storagePath));

        const updatedAttachments = attachments.filter(f => f.name !== file.name);
        await updateDoc(emailRef, { attachments: updatedAttachments });

        renderAttachments(); // re-render
      };

      div.appendChild(link);
      div.appendChild(delBtn);
      attachmentsList.appendChild(div);
    });
  }

  await renderAttachments(); // initial load

  // 📤 Upload de fichier(s)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = fileInput.files;
    if (!files.length) return;

    statusText.innerHTML = "⏳ Upload en cours...<br>";

    const uploaded = [];

    for (const file of files) {
      const path = `email-attachments/${user.uid}/${emailId}/${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      uploaded.push({ name: file.name, url });
    }

    const snap = await getDoc(emailRef);
    const current = snap.data().attachments || [];
    const updated = [...current, ...uploaded];

    await updateDoc(emailRef, { attachments: updated });

    fileInput.value = ""; // ✅ Vide le champ
    statusText.innerHTML = `<span style="color:limegreen;">✅ ${uploaded.length} fichier(s) ajouté(s)</span>`;
    renderAttachments(); // refresh
  });
});
