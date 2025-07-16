// ✅ submit-email.js – Script de soumission d'email

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const webhookURL = "https://hook.eu2.make.com/your-webhook-url"; // Remplace par ton webhook Make

  const form = document.getElementById("email-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    const popup = document.createElement("div");
    popup.id = "email-loading-overlay";
    popup.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;"><p>⏳ Génération de votre email…</p></div>`;
    document.body.appendChild(popup);

    const folder = document.getElementById("folderName")?.value || "";
    const slug = document.getElementById("slug")?.value || "";
    const subject = document.getElementById("email-subject")?.value || "";
    const desc = document.getElementById("email-desc")?.value || "";
    const productLink = document.getElementById("product-link")?.value || "";
    const productPrice = document.getElementById("product-price")?.value || "";
    const file = document.getElementById("attached-file")?.files[0];
    const emailType = document.getElementById("email-type")?.value || "";
    const linkedTunnelId = document.getElementById("linked-tunnel-id")?.value || "";
    const sendAt = document.getElementById("send-at")?.value || "";

    const createdAt = new Date().toISOString();
    const slugFinal = `${slug}-${Math.floor(10000 + Math.random() * 90000)}`;

    const firestoreData = {
      userId: user.uid,
      type: "email",
      folder,
      slug: slugFinal,
      subject,
      desc,
      productLink,
      productPrice,
      emailType,
      linkedTunnelId,
      sendAt,
      createdAt,
      pageUrl: `https://cdn.sellyo.fr/emails/${folder}/${slugFinal}.html`
    };

    const formData = new FormData();
    Object.entries(firestoreData).forEach(([key, val]) => formData.append(key, val));
    if (file) formData.append("file", file);

    try {
      await fetch(webhookURL, { method: "POST", body: formData });
      await addDoc(collection(db, "emails"), firestoreData);
      window.location.href = "tunnels.html";
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
