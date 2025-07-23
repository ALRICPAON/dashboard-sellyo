import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app); // ✅ init Firestore
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

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

    const slug = document.getElementById("slug")?.value || "";
    const subject = document.getElementById("subject")?.value || "";
    const desc = document.getElementById("desc")?.value || "";
    const tone = document.getElementById("tone")?.value || "";
    const productLink = document.getElementById("productLink")?.value || "";
    const productPrice = document.getElementById("productPrice")?.value || "";
    const replyTo = document.getElementById("replyTo").value;
    const landingId = document.getElementById("landingId")?.value || null;
const tunnelId = document.getElementById("tunnelId")?.value || null;


    const createdAt = new Date().toISOString();
    const slugFinal = `${slug}-${Math.floor(10000 + Math.random() * 90000)}`;

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
      // ✅ 1. Envoi à Make
      await fetch(webhookURL, {
        method: "POST",
        body: formData
      });

   // ✅ 2. Enregistrement dans Firestore
await addDoc(collection(db, "emails"), {
  name: slugFinal,
  subject,
  replyTo: replyTo,
  desc,
  tone,
  productLink,
  productPrice,
  userId: user.uid,
  createdAt: createdAt,
  url: `https://alricpaon.github.io/sellyo-hosting/emails/${encodeURIComponent(slugFinal)}.html`,
  type: "email",
  status: "draft",
  source: {
    type: "manuel"
  },
  ...(landingId && { landingId }),
  ...(tunnelId && { tunnelId })
});

      // ✅ Redirection
      // Affiche un message de création en cours
popup.innerHTML = `
  <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;padding:2rem;text-align:center;font-size:1.2rem;">
    ⏳ Création de votre email...<br><br>Merci de patienter jusqu’à <strong>1min30</strong>.<br>Ne fermez pas cette page.
  </div>`;
// Redirection après 60 secondes
setTimeout(() => {
  window.location.href = "emails.html";
}, 90000); // 1min30
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
