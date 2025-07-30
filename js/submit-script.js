import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = document.getElementById("script-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    const formData = new FormData(form);
    const title = formData.get("title") || "";
    const slugInput = formData.get("slug") || "";
    const slugBase = slugInput || title;
    const slugFinal = generateSlug(slugBase) + "-" + Math.floor(10000 + Math.random() * 90000);

    const data = {
      title,
      slug: slugFinal,
      description: formData.get("description") || "",
      goal: formData.get("goal") || "",
      audience: formData.get("audience") || "",
      tone: formData.get("tone") || "",
      language: formData.get("language") || "",
      keywords: formData.get("keywords") || "",
      videoType: formData.get("videoType") || "",
      includeCaption: formData.get("includeCaption") === "on",
      safeContent: formData.get("safeContent") === "on",
      userId: user.uid,
      type: "script", // 🔁 utilisé dans Make
      name: slugFinal,
      createdAt: Timestamp.now(),
      status: "pending",
      url: `https://alricpaon.github.io/sellyo-hosting/script/${slugFinal}.html`,
      source: { type: "manuel" }
    };

    // 🌀 Overlay attente
    const overlay = document.createElement("div");
    overlay.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:#000c;z-index:9999;color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:2rem;">
        <div class="loader" style="border: 5px solid #444; border-top: 5px solid #0af; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 2rem;"></div>
        <h2>⚙️ Création de votre script...</h2>
        <p>Merci de patienter jusqu’à <strong>1min30</strong>.<br>Ne fermez pas cette page.</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(overlay);

    try {
      // 🔁 Appel Make via Cloud Function
      await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/submitMainWebhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          name: slugFinal
        })
      });

      // 📝 Firestore dans sous-collection scripts/{uid}/items
      await addDoc(collection(doc(db, "scripts", user.uid), "items"), data);

      // ⏳ Attente et redirection
      setTimeout(() => {
        window.location.href = "scripts.html";
      }, 90000); // 1min30
    } catch (err) {
      console.error("❌ Erreur de soumission :", err);
      alert("Erreur : " + err.message);
    }
  });

  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});
