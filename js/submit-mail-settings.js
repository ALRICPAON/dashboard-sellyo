import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);

  const emailInput = document.getElementById("sender-email");
  const dnsBlock = document.getElementById("dns-instructions");
  const dnsOutput = document.getElementById("dns-values");
  const generateBtn = document.getElementById("generate-dns");
  const checkBtn = document.getElementById("check-dns");
  const statusMsg = document.getElementById("dns-status");

  generateBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const domain = email.split("@")[1];
    if (!domain) return alert("Email invalide");

    // Tu fais ici l’appel POST vers MailerSend pour créer le domaine
    // Pour cette démo, on affiche des valeurs simulées
    dnsOutput.innerText = `
Nom : @ | Type : TXT | Valeur : v=spf1 include:_spf.mailersend.net ~all
Nom : sellyo._domainkey.${domain} | Type : CNAME | Valeur : sellyo._domainkey.mailersend.net
Nom : rp._domainkey.${domain} | Type : CNAME | Valeur : rp.mailersend.net
    `.trim();

    dnsBlock.style.display = "block";
    statusMsg.textContent = "";
  });

  checkBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const domain = email.split("@")[1];

    // Ici tu appelles MailerSend GET /domains/domain_id pour vérifier (ou un endpoint Make si besoin)
    // Simulation pour test :
    const isValid = true; // à remplacer par la vraie vérification via API

    if (isValid) {
      statusMsg.textContent = "✅ Configuration validée avec succès !";
      statusMsg.style.color = "limegreen";
    } else {
      statusMsg.textContent = "❌ La configuration DNS n’est pas encore correcte.";
      statusMsg.style.color = "red";
    }
  });
});
