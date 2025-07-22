// ✅ Script complet : submit-workflow.js
// Crée le workflow + duplique les mails avec scheduledAt et destinataires

import { app } from "./firebase-init.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("workflow-form");
  const mailBlocksContainer = document.getElementById("mail-blocks-container");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Utilisateur non connecté");

    const name = document.getElementById("workflowName").value;
    const landingId = document.getElementById("landingSelect").value || null;
    const tunnelId = document.getElementById("tunnelSelect").value || null;

    // Collecte des mails du formulaire
    const emails = [];
    mailBlocksContainer.querySelectorAll(".mail-block").forEach((block) => {
      const emailId = block.querySelector("select").value;
      const delay = parseInt(block.querySelector("input[name='delayDays']").value || "0", 10);
      if (emailId) emails.push({ emailId, delay });
    });

    if (emails.length === 0) return alert("Ajoute au moins un mail.");

    // 1. Créer le workflow
    const workflowRef = await addDoc(collection(db, "workflows"), {
      userId: user.uid,
      name,
      landingId,
      tunnelId,
      emails,
      createdAt: serverTimestamp()
    });

    // 2. Récupérer les leads liés à la landing ou tunnel
    let leads = [];
    if (landingId || tunnelId) {
      const leadsRef = collection(db, "leads");
      const conditions = [];
   if (landingId) conditions.push(where("refId", "==", landingId));
if (tunnelId) conditions.push(where("refId", "==", tunnelId));

      const q = query(leadsRef, ...conditions);
      const snap = await getDocs(q);
      snap.forEach(doc => {
        const data = doc.data();
        if (data.email) leads.push(data.email);
      });
    }

    console.log("✅ Leads récupérés :", leads);

    // 3. Dupliquer chaque mail pour chaque lead
    for (const { emailId, delay } of emails) {
      const originalRef = doc(db, "emails", emailId);
      const originalSnap = await getDoc(originalRef);

      if (!originalSnap.exists()) {
        console.warn("❌ Email introuvable pour ID :", emailId);
        continue;
      }

      const original = originalSnap.data();
      console.log("📧 Email à dupliquer :", original);

      for (const toEmail of leads) {
        const scheduledDate = Timestamp.fromDate(new Date(Date.now() + delay * 86400000));
        console.log("→ Préparation envoi vers :", toEmail, "à la date", scheduledDate.toDate());

        try {
          await addDoc(collection(db, "emails"), {
            ...original,
            userId: user.uid,
            workflowId: workflowRef.id,
            scheduledAt: scheduledDate,
            recipients: [toEmail],
            source: {
              refId: workflowRef.id,
              type: "workflow"
            },
            status: "ready"
          });
        } catch (err) {
          console.error("❌ Erreur ajout email :", err);
        }
      }
    }

    alert("✅ Workflow et mails créés !");
    window.location.href = "emails.html";
  });
});
