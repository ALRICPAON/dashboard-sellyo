import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const MAILERSEND_API_KEY = "mlsn.5effbc1ef58f113b69226968756449401104197a50e144410640772130e0c143";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = document.getElementById("tunnel-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    const name = document.getElementById("tunnel-name")?.value || "";
    const goal = document.getElementById("tunnel-goal")?.value || "";
    // ... récupère tous les autres champs ...

    const firestoreData = {
      userId: user.uid,
      type: "landing",
      name,
      goal,
      // ajoute ici les autres champs nécessaires
      createdAt: new Date().toISOString()
    };

    try {
      // Envoie à Firestore
      await addDoc(collection(db, "tunnels"), firestoreData);

      // Optionnel : appel direct à MailerSend API (exemple POST simplifié)
      const domainToValidate = document.getElementById("customDomain")?.value || "";
      if (domainToValidate) {
        const response = await fetch("https://api.mailersend.com/v1/domain-identities", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MAILERSEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: domainToValidate,
            domain_type: "custom",
            dkim_selector: "mailersend"
          })
        });

        if (!response.ok) {
          const err = await response.json();
          console.error("Erreur MailerSend:", err);
          alert("Erreur validation domaine : " + (err.error || "Inconnue"));
          return;
        }
        const data = await response.json();
        console.log("Validation domaine réussie:", data);
      }

      alert("✅ Tunnel créé et domaine validé (test).");

    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
