import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

console.log("📦 JS chargé !");

document.addEventListener("DOMContentLoaded", () => {
  const setupBtn = document.getElementById("setup-domain");
  const domainInput = document.getElementById("custom-domain");
  const popup = document.getElementById("dns-popup");
  const dnsOutput = document.getElementById("dns-records");
  const statusText = document.getElementById("domain-status");
  const checkBtn = document.getElementById("check-domain-status");

  if (!setupBtn) {
    console.error("❌ Bouton 'Configurer' non trouvé dans le DOM");
    return;
  }

  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.warn("🟡 Utilisateur non connecté");
      return;
    }

    console.log("✅ Utilisateur connecté :", user.email);

    setupBtn.addEventListener("click", async () => {
      const domain = domainInput.value.trim().toLowerCase();
      if (!domain) return alert("Merci de renseigner un domaine valide.");

      console.log("📤 Envoi à createMailerSendDomain pour :", domain);

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

        console.log("🔁 Statut mis à jour via fonction backend :", newStatus);
      } catch (err) {
        console.error("❌ Erreur réseau/verif DNS :", err);
        alert("Erreur serveur lors de la vérification.");
      }
    });
  });
});
