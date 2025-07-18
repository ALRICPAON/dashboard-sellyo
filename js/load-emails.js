import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const emailsRef = collection(db, "emails");
  const q = query(emailsRef, where("userId", "==", user.uid), where("type", "==", "email"));
  const querySnapshot = await getDocs(q);

  const emailsList = document.getElementById("emails-list");
  if (!emailsList) return;

  if (querySnapshot.empty) {
    emailsList.innerHTML = "<p>Aucun email trouvé.</p>";
    return;
  }

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const container = document.createElement("div");
    container.style = "background:#222;padding:1rem;margin-bottom:1rem;border-radius:8px;";

    const name = data.name || "Sans titre";
    const createdAt = new Date(data.createdAt).toLocaleString("fr-FR");
    const url = data.url;

    container.innerHTML = `
      <h3 style="margin: 0 0 0.5rem 0;">${name}</h3>
      <p style="margin: 0.5rem 0;">🕒 Créé le : ${createdAt}</p>
      ${url ? `<a href="${url}" target="_blank" style="color:#00ccff;">📧 Voir l'email</a>` : ""}
    `;

    emailsList.appendChild(container);
  });
});
