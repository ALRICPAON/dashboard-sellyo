import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth(app);

document.getElementById("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const domainInput = document.getElementById("custom-domain");
  const messageDiv = document.getElementById("message");
  const customDomain = domainInput.value.trim();

  messageDiv.textContent = "⏳ Enregistrement en cours...";
  messageDiv.style.color = "#ccc";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      messageDiv.textContent = "❌ Vous devez être connecté.";
      messageDiv.style.color = "red";
      return;
    }

    try {
     const response = await fetch("https://createcustomdomainnetlify-mplcxq32ca-ew.a.run.app/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    userId: user.uid,
    customDomain: customDomain
  })
});

      const data = await response.json();

      if (response.ok) {
        messageDiv.textContent = "✅ Domaine enregistré avec succès !";
        messageDiv.style.color = "lightgreen";
      } else {
        console.error("Erreur:", data);
        messageDiv.textContent = "❌ Erreur : " + (data.error || "Domaine invalide.");
        messageDiv.style.color = "red";
      }
    } catch (err) {
      console.error("Erreur submit-settings:", err);
      messageDiv.textContent = "❌ Erreur lors de l'enregistrement du domaine.";
      messageDiv.style.color = "red";
    }
  });
});
