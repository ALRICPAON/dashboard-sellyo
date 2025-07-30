import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const form = document.getElementById("script-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté pour créer un script.");

    // 🔁 Récupération des données formulaire
    const slugInput = document.querySelector('[name="slug"]')?.value || "";
    const title = document.querySelector('[name="title"]')?.value || "";
    const description = document.querySelector('[name="description"]')?.value || "";
    const goal = document.querySelector('[name="goal"]')?.value || "";
    const audience = document.querySelector('[name="audience"]')?.value || "";
    const tone = document.querySelector('[name="tone"]')?.value || "";
    const language = document.querySelector('[name="language"]')?.value || "";
    const keywords = document.querySelector('[name="keywords"]')?.value || "";
    const videoType = document.querySelector('[name="videoType"]')?.value || "";
    const includeCaption = document.querySelector('[name="includeCaption"]')?.checked;
    const safeContent = document.querySelector('[name="safeContent"]')?.checked;

    // 🧠 Slug propre + unique
    const slugClean = generateSlug(slugInput || title);
    const slugFinal = `${slugClean}-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdAt = new Date().toISOString();

    // ⏳ Loader pendant la génération
    const popup = document.createElement("div");
    popup.id = "script-loading-overlay";
    popup.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;padding:2rem;text-align:center;font-size:1.2rem;">
        <div class="loader" style="border: 5px solid #444; border-top: 5px solid #0af; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin-bottom: 2rem;"></div>
        <p>🎬 <strong>Création de votre script...</strong></p>
        <p>Merci de patienter jusqu’à <strong>1min30</strong>.<br>Ne fermez pas cette page.</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(popup);

    try {
      // 📤 Appel Webhook Make
      const res = await fetch("https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          type: "script",
          slug: slugFinal,
          title,
          description,
          goal,
          audience,
          tone,
          language,
          keywords,
          videoType,
          includeCaption,
          safeContent
        })
      });

      if (!res.ok) throw new Error("Erreur webhook Make");

      console.log("📡 Script envoyé à Make avec succès");

      // 📝 Ajout Firestore dans scripts/{uid}/items
      await addDoc(collection(db, "scripts", user.uid, "items"), {
        userId: user.uid,
        title,
        slug: slugFinal,
        description,
        tone,
        language,
        goal,
        audience,
        keywords,
        videoType,
        includeCaption,
        safeContent,
        createdAt,
        url: `https://alricpaon.github.io/sellyo-hosting/scripts/${slugFinal}.html`,
        status: "pending",
        source: "manuel"
      });

      // ✅ Redirection après délai
      setTimeout(() => {
        window.location.href = "scripts.html";
      }, 90000); // 1min30

    } catch (err) {
      console.error("❌ Erreur de soumission :", err);
      alert("Erreur : " + err.message);
    }
  });

  // 🔤 Nettoyage du slug
  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});
