import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("📦 JS paramètres mail chargé");

document.addEventListener("DOMContentLoaded", () => {
  const setupBtn = document.getElementById("setup-domain");
  const fromEmailInput = document.getElementById("fromEmail");
  const popup = document.getElementById("dns-popup");
  const dnsOutput = document.getElementById("dns-records");
  const statusText = document.getElementById("domain-status");
  const checkBtn = document.getElementById("check-domain-status");

  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.warn("🟡 Utilisateur non connecté");
      return;
    }

    console.log("✅ Utilisateur connecté :", user.email);

    setupBtn.addEventListener("click", async () => {
      const fromEmail = fromEmailInput.value.trim().toLowerCase();
      const domain = fromEmail.split("@")[1];

      if (!fromEmail || !domain) {
        return alert("Merci de renseigner une adresse email valide.");
      }

      try {
        const res = await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/createMailerSendDomain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain })
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("❌ Erreur API MailerSend :", data.error);
          return alert("Erreur : " + data.error);
        }

        await setDoc(doc(db, "users", user.uid), {
          emailDomain: {
            name: domain,
            fromEmail,
            domainId: data.id,
            status: "pending"
          }
        }, { merge: true });

        const dns = data.dns || [];
        dnsOutput.innerText = dns.map(r =>
          `Nom : ${r.name} | Type : ${r.record_type} | Valeur : ${r.value}`
        ).join("\n");

        statusText.textContent = "🟡 En attente de validation";
        statusText.style.color = "orange";
        popup.style.display = "block";
        console.log("✅ Domaine enregistré, instructions DNS affichées");

      } catch (err) {
        console.error("❌ Erreur fetch domaine :", err);
        alert("Erreur serveur : " + err.message);
      }
    });

    checkBtn.addEventListener("click", async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const domainInfo = userDoc.data()?.emailDomain;

      if (!domainInfo || !domainInfo.domainId) return alert("Aucun domaine à vérifier");

      try {
        const res = await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/checkMailerSendDomainStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domainId: domainInfo.domainId,
            userId: user.uid
          })
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("❌ Erreur check DNS :", data.error);
          return alert("Erreur lors de la vérification DNS");
        }

        const newStatus = data.validated ? "validated" : "pending";

        if (data.validated) {
          statusText.textContent = "✅ Domaine vérifié et prêt à l'envoi";
          statusText.style.color = "limegreen";
        } else {
          statusText.textContent = "🟡 Toujours en attente de validation";
          statusText.style.color = "orange";
        }

        await setDoc(doc(db, "users", user.uid), {
          emailDomain: {
            ...domainInfo,
            status: newStatus
          }
        }, { merge: true });

        console.log("🔁 Statut mis à jour :", newStatus);
      } catch (err) {
        console.error("❌ Erreur réseau/verif DNS :", err);
        alert("Erreur serveur lors de la vérification.");
      }
    });
  });
});
