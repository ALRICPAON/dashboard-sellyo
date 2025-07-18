import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const emailsList = document.getElementById("emails-list");

// URL GitHub brute du dossier /emails/
const githubApiUrl = "https://api.github.com/repos/ALRICPAON/sellyo-hosting/contents/emails";

async function loadEmails(user) {
  try {
    const res = await fetch(githubApiUrl);
    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("Données invalides");

    emailsList.innerHTML = "";

    for (const file of data) {
      const name = file.name.replace(".html", "");
      const url = `https://alricpaon.github.io/sellyo-hosting/emails/${file.name}`;

      const container = document.createElement("div");
      container.style.marginBottom = "1rem";
      container.style.padding = "1rem";
      container.style.background = "#222";
      container.style.borderRadius = "8px";

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.textContent = `📧 ${name}`;
      link.style.color = "#00ccff";
      link.style.marginRight = "1rem";

      const btn = document.createElement("button");
      btn.textContent = "📩 Enregistrer dans Firebase";
      btn.style.padding = "6px 12px";
      btn.style.background = "#00ccff";
      btn.style.color = "black";
      btn.style.border = "none";
      btn.style.borderRadius = "5px";
      btn.style.cursor = "pointer";

      btn.addEventListener("click", async () => {
        try {
          await addDoc(collection(db, "emails"), {
            name,
            url,
            userId: user.uid,
            type: "email",
            createdAt: new Date().toISOString(),
          });
          alert("Email enregistré dans Firebase !");
        } catch (err) {
          alert("Erreur Firebase : " + err.message);
        }
      });

      container.appendChild(link);
      container.appendChild(btn);
      emailsList.appendChild(container);
    }
  } catch (err) {
    emailsList.innerHTML = "<p>Erreur de chargement des emails.</p>";
    console.error(err);
  }
}

// Vérifier si l'utilisateur est connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadEmails(user);
  } else {
    emailsList.innerHTML = "<p>Veuillez vous connecter pour voir vos emails.</p>";
  }
});
