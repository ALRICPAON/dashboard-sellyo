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

      const name = document.getElementById("workflow-name").value;
      const associatedId = document.getElementById("associated-id").value;
      const emailItems = document.querySelectorAll(".email-item");

      const emails = [];

      emailItems.forEach(item => {
        const emailId = item.querySelector(".email-id").value;
        const delay = parseInt(item.querySelector(".delay-days").value || "0");
        if (emailId) {
          emails.push({ emailId, delayDays: delay });
        }
      });

      if (!name || emails.length === 0) {
        alert("Nom et au moins un email requis.");
        return;
      }

      try {
        await addDoc(collection(db, "workflows"), {
          userId: user.uid,
          name,
          associatedId: associatedId || null,
          emails,
          createdAt: serverTimestamp()
        });
        alert("✅ Workflow créé !");
        window.location.href = "workflows.html"; // ou une autre page de redirection
      } catch (err) {
        console.error("❌ Erreur Firestore :", err);
        alert("Erreur lors de l'enregistrement.");
      }
    });
  });
});
