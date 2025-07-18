// ✅ load-emails.js – avec tous les boutons et cartes stylées

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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const container = document.getElementById("emails-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");

  const q = query(
    collection(db, "emails"),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);
  container.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    const htmlFile = `https://alricpaon.github.io/sellyo-hosting/emails/${data.slug}.html`;

    const card = document.createElement("div");
    card.className = "email-card";
    card.innerHTML = `
      <h3>📧 ${data.name || data.slug}</h3>
      <p><strong>Objet :</strong> ${data.subject}</p>
      <p><strong>Date :</strong> ${new Date(data.createdAt).toLocaleString()}</p>
      <div class="email-actions">
        <a href="${htmlFile}" target="_blank">👁️ Voir l’email</a>
        <button onclick="editEmail('${doc.id}')">📝 Modifier</button>
        <button onclick="uploadFile('${doc.id}')">📎 Uploader un fichier</button>
        <button onclick="sendEmail('${doc.id}')">📨 Envoyer</button>
        <button onclick="scheduleEmail('${doc.id}')">⏰ Programmer</button>
        <button onclick="linkEmail('${doc.id}')">🔗 Associer</button>
        <button onclick="deleteEmail('${doc.id}')">🗑️ Supprimer</button>
      </div>
    `;

    container.appendChild(card);
  });
});
