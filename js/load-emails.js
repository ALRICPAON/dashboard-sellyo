// ✅ Nouveau load-emails.js avec design modernisé et nouveaux boutons + compteur de leads

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

  const statusText = {
    sent: "✅ Envoyé",
    scheduled: "🕓 Programmé",
    draft: "📝 Brouillon",
    ready: "⏳ Envoi en cours"
  };

  const statusClass = {
    sent: "sent",
    scheduled: "scheduled",
    draft: "draft",
    ready: "scheduled"
  };

  const q = query(collection(db, "emails"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);
  emailsList.innerHTML = "";

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    const isWorkflow = data.isWorkflow === true;
    const isManuelOrLeads = data.source?.type === "manuel" || data.source?.type === "leads";
    if (isWorkflow || !isManuelOrLeads) continue;

    const id = docSnap.id;
    const slug = extractSlugFromURL(data.url || "");

    // 🔍 Récupération du nombre de leads associés via le refId dans source
   let recipientCount = 0;
const recipientsSnap = await getDocs(collection(db, `emails/${id}/recipients`));
recipientCount = recipientsSnap.size;

    const container = document.createElement("div");
    container.className = "email-card";
    container.innerHTML = `
      <div class="email-header">
        <span class="email-status ${statusClass[data.status] || "draft"}">
          ${statusText[data.status] || "📝 Brouillon"}
        </span>
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
        <button class="schedule-btn" data-id="${id}">🕓 Programmer</button>
        <button class="relance-btn" data-id="${id}">⏱️ Créer relance</button>
        <button class="target-btn" data-id="${id}">🎯 Destinataires</button>
        <span style="margin-left: 6px; font-size: 0.85em; color: #888;">
  🎯 ${recipientCount} destinataire${recipientCount > 1 ? "s" : ""}
</span>
      </div>
    `;
    emailsList.appendChild(container);
  }

  emailsList.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("edit-btn")) {
      window.location.href = `edit-email.html?id=${id}`;
    }
    if (e.target.classList.contains("upload-btn")) {
      window.location.href = `upload-email.html?id=${id}`;
    }
    if (e.target.classList.contains("target-btn")) {
      window.location.href = `destinataires.html?id=${id}`;
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
    if (e.target.classList.contains("send-btn")) {
      const confirmed = confirm("Envoyer cet email maintenant ?");
      if (!confirmed) return;

      const emailRef = doc(db, "emails", id);
      await updateDoc(emailRef, { status: "ready" });

      alert("📨 Email en cours d'envoi. Il sera traité dans quelques secondes.");
      const statusElem = e.target.closest(".email-card").querySelector(".email-status");
      statusElem.innerHTML = "⏳ Envoi en cours";
      statusElem.className = "email-status scheduled";
    }
    if (e.target.classList.contains("schedule-btn")) {
      openSchedulePopup(id);
    }
  });
});
