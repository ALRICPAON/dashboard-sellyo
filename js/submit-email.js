import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app); // ✅ init Firestore
  

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

  try {
    // ✅ 1. Envoi à la Function sécurisée (Make)
    await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/submitMainWebhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user.uid,
        type: "email",
        name: slugFinal,
        subject,
        desc,
        tone,
        productLink,
        productPrice,
        replyTo,
        landingId,
        tunnelId
      })
    });

    // ✅ 2. Enregistrement Firestore
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
        type: "manuel",
        refId: landingId || tunnelId || null
      },
      landingId: landingId || null,
      tunnelId: tunnelId || null
    });

    // ✅ 3. Message d'attente + redirection
    popup.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;padding:2rem;text-align:center;font-size:1.2rem;">
        <div class="loader" style="border: 5px solid #444; border-top: 5px solid #0af; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 2rem;"></div>
        <p>⏳ <strong>Création de votre email...</strong></p>
        <p>Merci de patienter jusqu’à <strong>1min30</strong>.<br>Ne fermez pas cette page.</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    setTimeout(() => {
      window.location.href = "emails.html";
    }, 90000); // 1min30

  } catch (err) {
    console.error("Erreur soumission :", err);
    alert("Erreur : " + err.message);
  }
});

