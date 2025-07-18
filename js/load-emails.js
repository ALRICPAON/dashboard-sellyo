// ✅ load-emails.js – Affiche la liste des emails avec actions (correctif inclus)

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const emailsList = document.getElementById("emails-list");

// 🔧 Ajoute cette fonction manquante
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

  emailsList.innerHTML = ""; // Nettoyage

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const slug = extractSlugFromURL(data.url || "");

    const container = document.createElement("div");
    container.className = "email-card";
    container.innerHTML = `
      <h3>${data.name || slug || "(sans nom)"}</h3>
      <p><strong>Objet :</strong> ${data.subject || "-"}</p>
      <p><strong>Description :</strong> ${data.desc || "-"}</p>
     ${Array.isArray(data.attachments) && data.attachments.length > 0
  ? `<div><strong>📎 Fichiers joints :</strong><br>${data.attachments.map(f => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
      <a href="${f.url}" target="_blank">${f.name}</a>
      <button class="delete-attachment-btn" data-email-id="${id}" data-file-name="${f.name}" style="background:red;color:white;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;">🗑️</button>
    </div>`).join("")}</div>`
  : ""
}
      <div class="email-actions">
        <a href="${data.url}" target="_blank">📩 Voir l’email</a>
        <button class="upload-btn" data-id="${id}">📤 Uploader un fichier</button>
        <button class="edit-btn" data-id="${id}">✏️ Modifier</button>
        <button class="delete-btn" data-id="${id}">🗑 Supprimer</button>
      </div>
    `;
    emailsList.appendChild(container);
  });

  // 🔁 Gestion des clics boutons
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
      e.target.closest(".email-card").remove(); // 🔥 supprime visuellement
    }
  });
});
