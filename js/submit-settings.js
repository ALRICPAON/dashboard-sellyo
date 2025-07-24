import { app } from "./firebase-init.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById("settings-form");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Utilisateur non connecté.");
    return (window.location.href = "index.html");
  }

  const userId = user.uid;

  // Charger les paramètres existants
  const settingsRef = doc(db, "settings", userId);
  const settingsSnap = await getDoc(settingsRef);
  if (settingsSnap.exists()) {
    const data = settingsSnap.data();
    document.getElementById("fromEmail").value = data.fromEmail || "";
    document.getElementById("fromName").value = data.fromName || "";
    document.getElementById("replyTo").value = data.replyTo || "";
    document.getElementById("customDomain").value = data.customDomain || "";
  }

  // Soumission du formulaire
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fromEmail = document.getElementById("fromEmail").value.trim();
    const fromName = document.getElementById("fromName").value.trim();
    const replyTo = document.getElementById("replyTo").value.trim();
    const customDomain = document.getElementById("customDomain").value.trim();

    // Enregistrement Firestore
    await setDoc(settingsRef, {
      fromEmail,
      fromName,
      replyTo,
      customDomain
    });

    alert("✅ Paramètres enregistrés !");
    if (customDomain) {
      await verifyDomainWithMailerSend(customDomain);
    }
  });

  async function verifyDomainWithMailerSend(domain) {
    try {
      const res = await fetch("https://api.mailersend.com/v1/domain-identities", {
        method: "POST",
        headers: {
          "Authorization": "Bearer mlsn.5effbc1ef58f113b69226968756449401104197a50e144410640772130e0c143",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: domain,
          domain_type: "custom",
          dkim_selector: "mailersend"
        })
      });

      const data = await res.json();

      if (data.dns) {
        // Afficher les entrées DNS dans une section dynamique
        const dnsDiv = document.getElementById("dns-instructions");
        dnsDiv.innerHTML = `<h3>📌 Enregistrements DNS à ajouter :</h3>`;
        data.dns.forEach(record => {
          dnsDiv.innerHTML += `
            <div style="margin-bottom: 1rem;">
              <strong>${record.record_type}</strong> → ${record.name}<br>
              <code>${record.value}</code>
            </div>
          `;
        });
        dnsDiv.scrollIntoView({ behavior: "smooth" });
      } else {
        alert("❌ Impossible de récupérer les enregistrements DNS MailerSend.");
      }

    } catch (err) {
      console.error("Erreur MailerSend :", err);
      alert("❌ Erreur lors de la tentative de vérification du domaine.");
    }
  }
});
