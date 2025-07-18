// ✅ load-emails.js – Affiche tous les mails du user connecté avec contenu GitHub

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const emailsList = document.getElementById("emails-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "index.html");

  const q = query(collection(db, "emails"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    emailsList.innerHTML = "<p>Aucun email trouvé.</p>";
    return;
  }

  emailsList.innerHTML = "";
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const mailURL = `https://alricpaon.github.io/sellyo-hosting/emails/${data.slug}.html`;

    const card = document.createElement("div");
    card.className = "email-card";
    card.style = `background:#222;padding:20px;border-radius:10px;margin-bottom:20px;`;

    card.innerHTML = `
      <h3>${data.slug}</h3>
      <p><strong>Objet :</strong> ${data.subject}</p>
      <p><strong>Ton :</strong> ${data.tone} &nbsp; | &nbsp; <strong>Prix :</strong> ${data.productPrice || "-"}</p>
      <p><strong>Date :</strong> ${new Date(data.createdAt).toLocaleString()}</p>
      <a href="${mailURL}" target="_blank">👁️ Voir le mail</a><br><br>
      <button onclick="navigator.clipboard.writeText('${mailURL}')">📋 Copier lien</button>
      <a href="email-settings.html?slug=${data.slug}"><button>⚙️ Modifier</button></a>
    `;

    emailsList.appendChild(card);
  });
});
