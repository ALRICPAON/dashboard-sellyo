// ✅ load-emails.js – Affiche la liste des emails avec actions complètes

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const emailsList = document.getElementById("emails-list");

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
    const slug = data.slug || "";
    const docId = docSnap.id;

    const container = document.createElement("div");
    container.className = "email-card";
    container.innerHTML = `
      <h3>${slug || "(sans nom)"}</h3>
      <p><strong>Objet :</strong> ${data.subject || "-"}</p>
      <p><strong>Description :</strong> ${data.desc || "-"}</p>
      <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 10px;">
        <a href="https://alricpaon.github.io/sellyo-hosting/emails/${slug}.html" target="_blank">📧 Voir l’email</a>
        <a href="edit-email.html?docId=${docId}">✏️ Modifier</a>
        <button class="delete-btn" data-id="${docId}">🗑️ Supprimer</button>
        <a href="upload-file.html?docId=${docId}&slug=${slug}">📎 Uploader un fichier</a>
      </div>
    `;
    emailsList.appendChild(container);
  });

  // Gestion suppression
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Confirmer la suppression de cet email ?")) {
        await deleteDoc(doc(db, "emails", id));
        location.reload();
      }
    });
  });
});
