import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("workflow-form");
  const emailBlocks = document.getElementById("email-blocks");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("workflow-name").value;
    const landingId = document.getElementById("landing-select").value || null;
    const tunnelId = document.getElementById("tunnel-select").value || null;

    const emails = [];

    emailBlocks.querySelectorAll(".email-block").forEach((block) => {
      const emailId = block.querySelector(".email-select").value;
      const delayDays = parseInt(block.querySelector(".delay-input").value, 10);

      if (emailId && !isNaN(delayDays)) {
        emails.push({
          emailId,
          delayDays
        });
      }
    });

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Utilisateur non connecté");
        return;
      }

      const workflowData = {
        name,
        landingId,
        tunnelId,
        emails,
        userId: user.uid,
        createdAt: serverTimestamp()
      };

      try {
        await addDoc(collection(db, "workflows"), workflowData);
        alert("✅ Workflow enregistré !");
        window.location.href = "emails.html";
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du workflow :", error);
        alert("❌ Erreur lors de l'enregistrement");
      }
    });
  });
});
