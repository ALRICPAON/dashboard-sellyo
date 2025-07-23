import { app } from "./firebase-init.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,        // ✅ pour cibler un document
  deleteDoc   // ✅ pour le supprimer
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

 // 🔁 Emails
const qEmails = query(collection(db, "emails"), where("userId", "==", user.uid));
const emailsSnap = await getDocs(qEmails);
window.availableEmails = [];

emailsSnap.forEach((doc) => {
  const data = doc.data();

  // ✅ Ne garder que les mails créés manuellement ou liés à des leads
  const typeSource = data.source?.type || null;
  if (typeSource !== "manuel" && typeSource !== "leads") return;

  console.log("📬 EMAIL ID", doc.id, "FULL DATA:", data);

  window.availableEmails.push({
    id: doc.id,
    name: data.name || "(Sans nom)",
    status: data.status || "⛔ (absent)"
  });
});

window.emailsReady = true;

  // 🔁 Landings
  const landingSelect = document.getElementById("landingSelect");
  const qLandings = query(collection(db, "tunnels"), where("userId", "==", user.uid), where("type", "==", "landing"));
  const landingsSnap = await getDocs(qLandings);
  landingsSnap.forEach((doc) => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = data.slug || doc.id;  // ✅ Utilise le slug si dispo
    opt.textContent = data.name || data.slug || "(Landing sans nom)";
    landingSelect.appendChild(opt);
  });

  // 🔁 Tunnels
  const tunnelSelect = document.getElementById("tunnelSelect");
  const qTunnels = query(collection(db, "tunnels"), where("userId", "==", user.uid), where("type", "==", "tunnel"));
  const tunnelsSnap = await getDocs(qTunnels);
  tunnelsSnap.forEach((doc) => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = data.slug || doc.id;  // ✅ Utilise le slug si dispo
    opt.textContent = data.name || data.slug || "(Tunnel sans nom)";
    tunnelSelect.appendChild(opt);
  });

// 🔁 Workflows
const workflowsContainer = document.getElementById("existing-workflows");
const qWorkflows = query(collection(db, "workflows"), where("userId", "==", user.uid));
const workflowsSnap = await getDocs(qWorkflows);

for (const workflowDoc of workflowsSnap.docs) {
  const workflowData = workflowDoc.data();
  const div = document.createElement("div");
  div.className = "workflow-item";

  const assoc = (workflowData.landingId ? `📍 Landing: ${workflowData.landingId}<br>` : '') +
                (workflowData.tunnelId ? `🔗 Tunnel: ${workflowData.tunnelId}<br>` : '');

  // 🔍 Emails liés à ce workflow (par champ `workflowId`)
  const emailQuery = query(collection(db, "emails"), where("workflowId", "==", workflowDoc.id));
  const emailSnap = await getDocs(emailQuery);

  let emailListHTML = "";
  emailSnap.forEach((doc) => {
    const data = doc.data();
    const name = data.name || "(Sans nom)";
    const status = data.status || "inconnu";
    const to = data.recipients?.[0] || "non défini";
    const delay = data.scheduledAt ? `🕒 ${new Date(data.scheduledAt.toDate()).toLocaleString()}` : "⏱️ -";

    emailListHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>📧 ${name} <em>[${status}]</em> → ${to} <small>${delay}</small></span>
        <button onclick="removeEmailFromWorkflow('${workflowDoc.id}', '${doc.id}')" style="background:none;border:none;color:#f55;cursor:pointer;font-size:1.2rem;">🗑️</button>
      </div>
    `;
  });

  div.innerHTML = `
    <strong>${workflowData.name}</strong><br>
    ${assoc}
    <div style="margin-top: 0.5rem;">
      ${emailListHTML || "<em>Aucun email trouvé pour ce workflow.</em>"}
    </div>
    <div style="margin-top: 1rem;">
     <button class="submit-btn" onclick="deleteWorkflow('${workflowDoc.id}')">🗑️ Supprimer</button>
    </div>
  `;

  workflowsContainer.appendChild(div);
} // ← fin du for...of

// ✅ Fonction placée au bon endroit, une seule fois
window.deleteWorkflow = async function(workflowId) {
  if (!confirm("❌ Supprimer ce workflow et tous les emails associés ?")) return;

  try {
    // 🔁 Supprimer tous les emails liés à ce workflow
    const emailQuery = query(collection(db, "emails"), where("workflowId", "==", workflowId));
    const emailSnap = await getDocs(emailQuery);

    const deletePromises = [];
    emailSnap.forEach((docSnap) => {
      deletePromises.push(deleteDoc(doc(db, "emails", docSnap.id)));
    });

    await Promise.all(deletePromises); // supprime tous les mails

    // 🗑️ Supprimer le workflow
    await deleteDoc(doc(db, "workflows", workflowId));

    alert("✅ Workflow et emails associés supprimés !");
    location.reload();

  } catch (err) {
    console.error("❌ Erreur suppression workflow ou emails :", err);
    console.log("💥 Détail de l'erreur Firebase :", JSON.stringify(err, null, 2));
    alert("❌ Erreur lors de la suppression du workflow ou des emails.");
  }
};
  }); // ✅ FIN de onAuthStateChanged

