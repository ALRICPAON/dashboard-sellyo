import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

// 🔧 Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("script-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📩 Formulaire soumis");

    const formData = new FormData(form);
    const title = formData.get("title");
    const slugInput = formData.get("slug");
    const slug = slugInput || generateSlug(title);

    const data = {
      slug,
      title,
      description: formData.get("description"),
      goal: formData.get("goal"),
      audience: formData.get("audience"),
      tone: formData.get("tone"),
      language: formData.get("language"),
      keywords: formData.get("keywords"),
      videoType: formData.get("videoType"),
      includeCaption: formData.get("includeCaption") === "on",
      safeContent: formData.get("safeContent") === "on",
      type: "script"
    };

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non authentifié");
      data.userId = user.uid;
      console.log("✅ Utilisateur connecté :", data.userId);
    } catch (err) {
      console.error("❌ Erreur d'authentification :", err);
      alert("Vous devez être connecté pour créer un script.");
      return;
    }

    console.log("📤 Données à envoyer à Make :", data);

    try {
      const response = await fetch("https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      console.log("📬 Réponse Make reçue :", response.status, response.statusText);

      if (!response.ok) {
        throw new Error("Erreur HTTP " + response.status);
      }

      alert("✅ Script en cours de génération. Il apparaîtra bientôt dans votre interface.");
      form.reset();
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi à Make :", error);
      alert("Erreur lors de la soumission du formulaire. Veuillez réessayer.");
    }
  });

  // 🔤 Générateur de slug propre
  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});
