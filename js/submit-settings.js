import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);

  const form = document.getElementById("settings-form");
  const dnsBlock = document.getElementById("dns-instructions");
  const dnsOutput = document.getElementById("dns-values");
  const statusMsg = document.getElementById("dns-status");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Veuillez vous connecter.");

    const fromName = document.getElementById("fromName")?.value || "";
    const fromEmail = document.getElementById("fromEmail")?.value || "";
    const replyTo = document.getElementById("replyTo")?.value || "";
    const customDomain = document.getElementById("customDomain")?.value || "";

    if (!customDomain) {
      return alert("Veuillez entrer un domaine personnalisé.");
    }

    try {
      const res = await fetch("https://create-mailersend-domain-<ID>.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          fromName,
          fromEmail,
          replyTo,
          customDomain,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de l’appel à la fonction");

      const data = await res.json();

      dnsBlock.style.display = "block";
      dnsOutput.textContent = data.dns || "✅ Domaine soumis avec succès.";
      statusMsg.textContent = "📡 Domaine en attente de validation DNS.";

    } catch (err) {
      console.error("Erreur submit-settings:", err);
      alert("Erreur lors de l'enregistrement des paramètres.");
    }
  });
});
