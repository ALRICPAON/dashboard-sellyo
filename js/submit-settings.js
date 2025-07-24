import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("settings-form");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fromEmail = document.getElementById("fromEmail").value.trim();
      const replyTo = document.getElementById("replyTo").value.trim();
      const domaineEmail = document.getElementById("domaine").value.trim();
      const domaineTunnel = document.getElementById("customDomain").value.trim();

      if (!fromEmail || !replyTo || !domaineEmail || !domaineTunnel) {
        alert("❌ Merci de remplir tous les champs.");
        return;
      }

      try {
        await setDoc(doc(db, "settings", user.uid), {
          fromEmail,
          replyTo,
          domaineEmail,
          domaineTunnel,
          updatedAt: new Date()
        });

        alert("✅ Paramètres enregistrés !");
        window.location.href = "dashboard.html";
      } catch (err) {
        console.error("Erreur Firestore :", err);
        alert("❌ Une erreur est survenue.");
      }
    });
  });
});
