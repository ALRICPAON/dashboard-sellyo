// ✅ Nouveau load-emails.js avec design modernisé et nouveaux boutons

import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const emailsList = document.getElementById("emails-list");

function extractSlugFromURL(url) {
  if (!url) return "";
  const parts = url.split("/");
  const file = parts[parts.length - 1];
  return file.replace(".html", "");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "emails"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);
  emailsList.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const slug = extractSlugFromURL(data.url || "");

    const container = document.createElement("div");
    container.className = "email-card";
    container.innerHTML = `
      <div class="email-header">
        <h3>${data.name || slug || "(sans nom)"}</h3>
        <p><strong>Objet :</strong> ${data.subject || "-"}</p>
        <p><strong>Description :</strong> ${data.desc || "-"}</p>
      </div>

      ${Array.isArray(data.attachments) && data.attachments.length > 0 ? `
        <div class="attachments">
          <strong>📎 Fichiers joints :</strong>
          <ul>
            ${data.attachments.map(f => `
              <li>
                <a href="${f.url}" target="_blank">${f.name}</a>
                <button class="delete-attachment-btn" data-email-id="${id}" data-file-name="${f.name}">🗑️</button>
              </li>`).join("")}
          </ul>
        </div>` : ""
      }

      <div class="email-actions">
        <button class="view-btn" data-id="${id}" onclick="window.open('${data.url}', '_blank')">📩 Voir</button>
        <button class="edit-btn" data-id="${id}">✏️ Modifier</button>
        <button class="upload-btn" data-id="${id}">📤 Uploader</button>
        <button class="delete-btn" data-id="${id}">🧨 Supprimer</button>
        <button class="send-btn" data-id="${id}">📨 Envoyer</button>
        <button class="relance-btn" data-id="${id}">⏱️ Créer relance</button>
        <button class="target-btn" data-id="${id}">🎯 Destinataires</button>
      </div>
    `;
    emailsList.appendChild(container);
  });

  emailsList.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit-btn")) {
      window.location.href = `edit-email.html?id=${id}`;
    }

    if (e.target.classList.contains("upload-btn")) {
      window.location.href = `upload-email.html?id=${id}`;
    }

    if (e.target.classList.contains("delete-btn")) {
      const confirmed = confirm("Confirmer la suppression de cet email ?");
      if (!confirmed) return;
      await deleteDoc(doc(db, "emails", id));
      e.target.closest(".email-card").remove();
    }

    if (e.target.classList.contains("delete-attachment-btn")) {
      const emailId = e.target.dataset.emailId;
      const fileName = e.target.dataset.fileName;
      const confirmed = confirm(`Supprimer : ${fileName} ?`);
      if (!confirmed) return;

      const storagePath = `email-attachments/${user.uid}/${emailId}/${fileName}`;
      await deleteObject(ref(storage, storagePath));

      const emailRef = doc(db, "emails", emailId);
      const docSnap = await getDoc(emailRef);
      const data = docSnap.data();
      const updated = (data.attachments || []).filter(f => f.name !== fileName);
      await updateDoc(emailRef, { attachments: updated });
      window.location.reload();
    }
  });
});
