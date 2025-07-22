import { app } from "./firebase-init.js";
import {
  getAuth
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
  const mailBlocksContainer = document.getElementById("mail-blocks-container");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("Utilisateur non connecté");
      return;
    }

    const name = document.getElementById("workflowName").value;
    const landingId = document.getElementById("landingSelect").value || null;
    const tunnelId = document.getElementById("tunnelSelect").value || null;

    const emails = [];
    mailBlocksContainer.querySelectorAll(".mail-block").forEach((block) => {
      const emailId = block.querySelector("select").value;
      const delay = parseInt(block.querySelector("input[name='delayDays']").value || "0", 10);

      if (emailId) {
        emails.push({ emailId, delay });
      }
    });

    if (emails.length === 0) {
      alert("Merci d’ajouter au moins un mail à votre workflow.");
      return;
    }

    const data = {
      userId: user.uid,
      name,
      landingId,
      tunnelId,
      emails,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, "workflows"), data);
      alert("✅ Workflow enregistré !");
      window.location.href = "emails.html";
    } catch (err) {
      console.error("❌ Erreur Firestore :", err);
      alert("Erreur lors de l'enregistrement du workflow.");
    }
  });
});
