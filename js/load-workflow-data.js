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
    window.availableEmails.push({
      id: doc.id,
      name: data.name || "(Sans nom)"
    });
  });

  window.emailsReady = true;

  // 🔁 Landings
  const landingSelect = document.getElementById("landingSelect");
  const qLandings = query(collection(db, "tunnels"), where("userId", "==", user.uid), where("type", "==", "landing"));
  const landingsSnap = await getDocs(qLandings);
  landingsSnap.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().name || "(Landing sans nom)";
    landingSelect.appendChild(opt);
  });

  // 🔁 Tunnels
  const tunnelSelect = document.getElementById("tunnelSelect");
  const qTunnels = query(collection(db, "tunnels"), where("userId", "==", user.uid), where("type", "==", "tunnel"));
  const tunnelsSnap = await getDocs(qTunnels);
  tunnelsSnap.forEach((doc) => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.data().name || "(Tunnel sans nom)";
    tunnelSelect.appendChild(opt);
  });

  // 🔁 Workflows
  const workflowsContainer = document.getElementById("existing-workflows");
  const qWorkflows = query(collection(db, "workflows"), where("userId", "==", user.uid));
  const workflowsSnap = await getDocs(qWorkflows);

  workflowsSnap.forEach((doc) => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "workflow-item";

    const assoc = (data.landingId ? `📍 Landing: ${data.landingId}<br>` : '') +
                  (data.tunnelId ? `🔗 Tunnel: ${data.tunnelId}<br>` : '');

    const emails = (data.emails || []).map(e => `📧 ${e.emailId} → J+${e.delayDays}`).join("<br>");

    div.innerHTML = `
      <strong>${data.name}</strong><br>
      ${assoc}
      <div style="margin-top: 0.5rem;">${emails}</div>
      <div style="margin-top: 1rem;">
        <button class="submit-btn" onclick="editWorkflow('${doc.id}')">✏️ Modifier</button>
        <button class="remove-btn" onclick="deleteWorkflow('${doc.id}', this)">🗑️ Supprimer</button>
      </div>
    `;

    workflowsContainer.appendChild(div);
  });
});
