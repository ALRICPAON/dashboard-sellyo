import { app } from "./firebase-init.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  doc, getDoc, getDocs, query, where
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
        const workflowRef = await addDoc(collection(db, "workflows"), {
          userId: user.uid,
          name,
          landingId,
          tunnelId,
          emails,
          createdAt: serverTimestamp(),
          ready: true
        });

        const now = new Date();

        for (const { emailId, delayDays } of emails) {
          const scheduledAt = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000);
          const originalDoc = await getDoc(doc(db, "emails", emailId));
          if (!originalDoc.exists()) continue;
          const originalData = originalDoc.data();

          const leadsQuery = query(
            collection(db, "leads"),
            where(landingId ? "landingId" : "tunnelId", "==", landingId || tunnelId)
          );
          const leadsSnapshot = await getDocs(leadsQuery);

          if (leadsSnapshot.empty) {
            await addDoc(collection(db, "emails"), {
              userId: user.uid,
              emailId,
              workflowId: workflowRef.id,
              scheduledAt,
              status: "scheduled",
              subject: originalData.subject || "",
              url: originalData.url || "",
              attachments: originalData.attachments || [],
              associatedId: landingId || tunnelId || null
            });
          } else {
            for (const leadDoc of leadsSnapshot.docs) {
              const leadData = leadDoc.data();
              await addDoc(collection(db, "emails"), {
                userId: user.uid,
                emailId,
                workflowId: workflowRef.id,
                scheduledAt,
                status: "scheduled",
                subject: originalData.subject || "",
                url: originalData.url || "",
                attachments: originalData.attachments || [],
                associatedId: landingId || tunnelId || null,
                recipientEmail: leadData.email || ""
              });
            }
          }
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
