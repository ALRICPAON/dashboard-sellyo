import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp"; // Ton webhook Make

  const form = document.getElementById("email-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    // Affichage popup de chargement
    const popup = document.createElement("div");
    popup.id = "email-loading-overlay";
    popup.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;"><p>⏳ Génération de votre email…</p></div>`;
    document.body.appendChild(popup);

    // Lecture des champs
    const slug = document.getElementById("slug")?.value || "";
    const subject = document.getElementById("subject")?.value || "";
    const desc = document.getElementById("desc")?.value || "";
    const tone = document.getElementById("tone")?.value || "";
    const productLink = document.getElementById("productLink")?.value || "";
    const productPrice = document.getElementById("productPrice")?.value || "";

    const createdAt = new Date().toISOString();
    const slugFinal = `${slug}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Données à envoyer
    const formData = new FormData();
    formData.append("userId", user.uid);
    formData.append("type", "email");
    formData.append("slug", slugFinal);
    formData.append("subject", subject);
    formData.append("desc", desc);
    formData.append("tone", tone);
    formData.append("productLink", productLink);
    formData.append("productPrice", productPrice);
    formData.append("createdAt", createdAt);

    try {
      await fetch(webhookURL, {
        method: "POST",
        body: formData
      });

      // Redirection après succès
      window.location.href = "emails.html";
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
