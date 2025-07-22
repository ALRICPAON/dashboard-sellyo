import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("workflow-form");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const workflowName = document.getElementById("workflow-name").value;
      const selectedLanding = document.getElementById("landingSelect").value;
      const selectedTunnel = document.getElementById("tunnelSelect").value;
      const userId = user.uid;

      const emailBlocks = document.querySelectorAll(".email-block");

      const emails = [];

      for (const block of emailBlocks) {
        const emailId = block.querySelector(".email-select").value;
        const delayDays = parseInt(block.querySelector(".delay-days").value || "0");

        if (emailId) {
          emails.push({ emailId, delayDays });
        }
      }

      const workflowRef = await addDoc(collection(db, "workflows"), {
        name: workflowName,
        userId,
        createdAt: serverTimestamp(),
        emails,
        landingId: selectedLanding || null,
        tunnelId: selectedTunnel || null,
        ready: true
      });

      console.log("Workflow enregistré avec ID :", workflowRef.id);

      // 🔍 Récupération des leads associés
      const leadsRef = collection(db, "leads");
      const leadsQuery = query(leadsRef, where("userId", "==", userId), where("type", "==", "landing"));
      const leadsSnapshot = await getDocs(leadsQuery);

      console.log("Nombre de leads trouvés :", leadsSnapshot.size);

      for (const leadDoc of leadsSnapshot.docs) {
        const leadData = leadDoc.data();

        if (!leadData.email) {
          console.warn("Lead sans email :", leadDoc.id);
          continue;
        }

        for (const emailEntry of emails) {
          const scheduledDate = new Date();
          scheduledDate.setDate(scheduledDate.getDate() + emailEntry.delayDays);

          await addDoc(collection(db, "emails"), {
            emailId: emailEntry.emailId,
            userId,
            workflowId: workflowRef.id,
            associatedId: selectedLanding || selectedTunnel || null,
            recipientEmail: leadData.email,
            status: "scheduled",
            scheduledAt: scheduledDate,
            subject: "Email workflow",
            url: "",
            attachments: [],
          });

          console.log(`Email programmé pour ${leadData.email} à J+${emailEntry.delayDays}`);
        }
      }

      alert("✅ Workflow et mails créés !");
      window.location.href = "emails.html";
    });
  });
});

