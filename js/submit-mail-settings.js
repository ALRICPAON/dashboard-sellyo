import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const setupBtn = document.getElementById("setup-domain");
const domainInput = document.getElementById("custom-domain");
const popup = document.getElementById("dns-popup");
const dnsOutput = document.getElementById("dns-records");
const statusText = document.getElementById("domain-status");
const checkBtn = document.getElementById("check-domain-status");

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  setupBtn.addEventListener("click", async () => {
    const domain = domainInput.value.trim().toLowerCase();
    if (!domain) return alert("Merci de renseigner un domaine valide.");

    // 📤 Appel fonction cloud pour créer le domaine
    const res = await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/createMailerSendDomain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain })
    });

    const data = await res.json();
    if (!res.ok) {
      alert("❌ Erreur création domaine : " + data.error);
      return;
    }

    // 🔐 Stocke dans Firestore
    await setDoc(doc(db, "users", user.uid), {
      emailDomain: {
        name: domain,
        domainId: data.id,
        status: "pending"
      }
    }, { merge: true });

    // 🧾 Affiche les DNS
    const dns = data.dns?.records || [];
    dnsOutput.innerText = dns.map(r =>
      `Nom : ${r.name} | Type : ${r.record_type} | Valeur : ${r.value}`
    ).join("\n");

    statusText.textContent = "🟡 En attente de validation";
    statusText.style.color = "orange";
    popup.style.display = "block";
  });

  checkBtn.addEventListener("click", async () => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const domainInfo = userDoc.data()?.emailDomain;

    if (!domainInfo || !domainInfo.domainId) return alert("Aucun domaine à vérifier");

    const res = await fetch(`https://api.mailersend.com/v1/domain-identities/${domainInfo.domainId}`, {
      headers: {
        Authorization: `Bearer VOTRE_SECRET_MAILERSEND`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();

    const isVerified = data.dkim?.status === "verified" && data.spf?.status === "verified";

    const newStatus = isVerified ? "validated" : "pending";

    // 💾 Met à jour le statut Firestore
    await setDoc(doc(db, "users", user.uid), {
      emailDomain: {
        ...domainInfo,
        status: newStatus
      }
    }, { merge: true });

    if (isVerified) {
      statusText.textContent = "✅ Domaine vérifié et prêt à l'envoi";
      statusText.style.color = "limegreen";
    } else {
      statusText.textContent = "🟡 Toujours en attente de validation";
      statusText.style.color = "orange";
    }
  });
});
