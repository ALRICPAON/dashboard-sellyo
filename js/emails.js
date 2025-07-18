import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const emailList = document.getElementById("email-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const q = query(collection(db, "emails"), where("userId", "==", user.uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    emailList.innerHTML = "<p>Aucun email généré pour le moment.</p>";
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.style.background = "#222";
    div.style.padding = "1rem";
    div.style.borderRadius = "10px";

    div.innerHTML = `
      <h3>${data.subject || "Sans objet"}</h3>
      <p><strong>Nom :</strong> ${data.slug}</p>
      <p><strong>Ton :</strong> ${data.tone}</p>
      <p><strong>Prix :</strong> ${data.productPrice || "-"}</p>
      <p><strong>Lien produit :</strong> <a href="${data.productLink}" target="_blank" style="color: #4af;">${data.productLink || "—"}</a></p>
      <a href="https://alricpaon.github.io/sellyo-hosting/emails/${data.slug}.html" target="_blank" style="color: #0f0;">📧 Voir l'email généré</a>
    `;

    emailList.appendChild(div);
  });
});
