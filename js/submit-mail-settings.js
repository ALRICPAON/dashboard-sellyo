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

const domainInput = document.getElementById("emailDomain");
const generateBtn = document.getElementById("generateDnsBtn");
const dnsBlock = document.getElementById("dnsInstructions");
const dnsList = document.getElementById("dnsList");
const verifyBtn = document.getElementById("verifyDnsBtn");
const dnsStatus = document.getElementById("dnsStatus");

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  generateBtn.addEventListener("click", async () => {
    const domain = domainInput.value.trim().toLowerCase();
    if (!domain) return alert("Merci d’entrer un domaine valide.");

    try {
      const res = await fetch("https://us-central1-sellyo-3bbdb.cloudfunctions.net/createMailerSendDomain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await setDoc(doc(db, "users", user.uid), {
        emailDomain: {
          name: domain,
          domainId: data.id,
          status: "pending"
        }
      }, { merge: true });

      dnsList.innerHTML = "";
      for (const record of data.dns || []) {
        const li = document.createElement("li");
        li.textContent = `Nom : ${record.name} | Type : ${record.record_type} | Valeur : ${record.value}`;
        dnsList.appendChild(li);
      }

      dnsStatus.textContent = "🟡 En attente de validation";
      dnsStatus.style.color = "orange";
      dnsBlock.style.display = "block";
    } catch (err) {
      console.error("❌ Erreur création domaine :", err);
      alert("Erreur lors de l’enregistrement du domaine.");
    }
  });

  verifyBtn.addEventListener("click", async () => {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const domainInfo = userDoc.data()?.emailDomain;

    if (!domainInfo?.domainId) return alert("Aucun domaine trouvé pour cet utilisateur.");

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
      const isValid = data.validated;

      await setDoc(doc(db, "users", user.uid), {
        emailDomain: {
          ...domainInfo,
          status: isValid ? "validated" : "pending"
        }
      }, { merge: true });

      dnsStatus.textContent = isValid
        ? "✅ Domaine vérifié et prêt à l'envoi"
        : "🟡 Toujours en attente de validation";
      dnsStatus.style.color = isValid ? "limegreen" : "orange";
    } catch (err) {
      console.error("❌ Erreur de vérification DNS :", err);
      alert("Erreur lors de la vérification DNS.");
    }
  });
});
