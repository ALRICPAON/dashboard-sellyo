import { app } from "./firebase-init.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, query, where, getDocs
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

  console.log("📬 EMAIL ID", doc.id, "FULL DATA:", data); // ✅ Affiche tout

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

  // 📨 Charger les vrais emails liés à ce workflow
  const qEmails = query(
    collection(db, "emails"),
    where("workflowId", "==", workflowDoc.id)
  );
  const emailsSnap = await getDocs(qEmails);

  let emailListHTML = "";
  emailsSnap.forEach((doc) => {
    const data = doc.data();
    const name = data.name || "(Sans nom)";
    const status = data.status || "inconnu";
    const to = data.recipients?.[0] || "non défini";

    emailListHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span>📧 ${name} <em>[${status}]</em> → ${to}</span>
        <button onclick="removeEmailFromWorkflow('${workflowDoc.id}', '${doc.id}')" style="background:none;border:none;color:#f55;cursor:pointer;font-size:1.2rem;">🗑️</button>
      </div>
    `;
  });

  div.innerHTML = `
    <strong>${workflowData.name}</strong><br>
    ${assoc}
    <div style="margin-top: 0.5rem;">
      ${emailListHTML}
    </div>
    <div style="margin-top: 1rem;">
      <button class="submit-btn" onclick="editWorkflow('${workflowDoc.id}')">✏️ Modifier</button>
    </div>
  `;

  workflowsContainer.appendChild(div);
}
