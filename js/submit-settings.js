import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("settings-form");
const generateDnsBtn = document.getElementById("generateDns");
const dnsInstructionsDiv = document.getElementById("dnsInstructions");
const dnsList = document.getElementById("dnsList");
const verificationStatus = document.getElementById("verificationStatus");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Utilisateur non connecté.");
    window.location.href = "index.html";
    return;
  }

  const userId = user.uid;
  const settingsRef = doc(db, "settings", userId);

  // Charger les paramètres existants
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists()) {
    const data = settingsSnap.data();
    document.getElementById("fromEmail").value = data.fromEmail || "";
    document.getElementById("fromName").value = data.fromName || "";
    document.getElementById("replyTo").value = data.replyTo || "";
    document.getElementById("customDomain").value = data.customDomain || "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fromEmail = document.getElementById("fromEmail").value.trim();
    const fromName = document.getElementById("fromName").value.trim();
    const replyTo = document.getElementById("replyTo").value.trim();
    const customDomain = document.getElementById("customDomain").value.trim();

    try {
      await setDoc(settingsRef, {
        fromEmail,
        fromName,
        replyTo,
        customDomain
      });

      alert("✅ Paramètres enregistrés !");
    } catch (error) {
      console.error("Erreur enregistrement paramètres :", error);
      alert("❌ Erreur lors de l'enregistrement.");
    }
  });

  generateDnsBtn.addEventListener("click", async () => {
    const domain = document.getElementById("customDomain").value.trim();
    if (!domain) {
      alert("Merci de renseigner un domaine avant de générer les DNS.");
      return;
    }

    verificationStatus.textContent = "⏳ Vérification en cours...";
    dnsInstructionsDiv.style.display = "none";
    dnsList.innerHTML = "";

    try {
      // IMPORTANT : Ne jamais exposer ta clé API dans le frontend en prod !
      // Ici c'est un exemple uniquement pour test local/dev.
      const response = await fetch("https://api.mailersend.com/v1/domain-identities", {
        method: "POST",
        headers: {
          Authorization: "Bearer TON_API_KEY_ICI",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: domain,
          domain_type: "custom",
          dkim_selector: "mailersend"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.dns && data.dns.length > 0) {
        dnsInstructionsDiv.style.display = "block";
        data.dns.forEach((record) => {
          const li = document.createElement("li");
          li.innerHTML = `<strong>${record.record_type}</strong> → ${record.name} : <code>${record.value}</code>`;
          dnsList.appendChild(li);
        });
        verificationStatus.textContent = "✅ Enregistrements DNS récupérés.";
      } else {
        verificationStatus.textContent = "❌ Impossible de récupérer les enregistrements DNS.";
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du domaine :", error);
      verificationStatus.textContent = "❌ Erreur lors de la vérification du domaine.";
    }
  });
});
