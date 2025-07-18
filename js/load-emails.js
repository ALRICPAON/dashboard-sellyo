// ✅ load-emails.js – Affiche la liste des emails avec actions

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const slug = data.slug || "";

    const container = document.createElement("div");
    container.className = "email-card";
    container.innerHTML = `
      <h3>${slug || "(sans nom)"}</h3>
      <p><strong>Objet :</strong> ${data.subject || "-"}</p>
      <p><strong>Description :</strong> ${data.desc || "-"}</p>
      <div class="buttons">
        ${slug ? `<a href="https://alricpaon.github.io/sellyo-hosting/emails/${slug}.html" target="_blank">👁️ Voir l’email</a>` : "<span style='color:gray;'>Aucun lien</span>"}
        <button onclick="editEmail('${doc.id}')">📝 Modifier</button>
        <button onclick="uploadFile('${doc.id}')">📎 Uploader un fichier</button>
        <button onclick="sendEmail('${doc.id}')">📨 Envoyer</button>
        <button onclick="scheduleEmail('${doc.id}')">⏰ Programmer</button>
        <button onclick="associateEmail('${doc.id}')">🔗 Associer</button>
        <button onclick="deleteEmail('${doc.id}')">🗑️ Supprimer</button>
      </div>
    `;
    emailsList.appendChild(container);
  });
});
