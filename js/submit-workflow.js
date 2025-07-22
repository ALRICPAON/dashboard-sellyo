import { app } from "./firebase-init.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("workflow-form");

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("workflowName").value.trim();
      const landingId = document.getElementById("landingSelect").value || null;
      const tunnelId = document.getElementById("tunnelSelect").value || null;
      const blocks = document.querySelectorAll("#mail-blocks-container .mail-block");

      const emails = [];
      blocks.forEach((block) => {
        const emailId = block.querySelector("select").value;
        const delayDays = parseInt(block.querySelector("input").value || "0");
        if (emailId) {
          emails.push({ emailId, delayDays });
        }
      });

      if (!name || emails.length === 0) {
        alert("Le nom du workflow et au moins un email sont obligatoires.");
        return;
      }

      try {
        // 🔹 Étape 1 : création du workflow
        const workflowRef = await addDoc(collection(db, "workflows"), {
          userId: user.uid,
          name,
          landingId,
          tunnelId,
          emails,
          createdAt: serverTimestamp(),
          ready: true
        });

        // 🔹 Étape 2 : création des mails liés
        const now = new Date();

        for (const { emailId, delayDays } of emails) {
          const scheduledAt = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);

          await addDoc(collection(db, "emails"), {
            userId: user.uid,
            emailId,
            workflowId: workflowRef.id,
            scheduledAt: scheduledAt,
            status: "scheduled"
          });
        }

        alert("✅ Workflow créé avec succès !");
        window.location.reload();

      } catch (err) {
        console.error("Erreur Firestore :", err);
        alert("❌ Une erreur est survenue.");
      }
    });
  });
});
