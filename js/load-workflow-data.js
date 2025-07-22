import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // 🔁 Récupération des emails
  const qEmails = query(collection(db, "emails"), where("userId", "==", user.uid));
  const emailsSnap = await getDocs(qEmails);

  window.availableEmails = []; // bien dans `window.` pour que le script inline les voie

  emailsSnap.forEach((doc) => {
    const data = doc.data();
    window.availableEmails.push({
      id: doc.id,
      name: data.name || "(Sans nom)"
    });
  });

  window.emailsReady = true; // ✅ ça active le bouton et les blocs

  // 🔁 Récupération des tunnels/landings
  const assocSelect = document.getElementById("associatedId");
  const tunnelsSnap = await getDocs(query(collection(db, "tunnels"), where("userId", "==", user.uid)));

  tunnelsSnap.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.name || "(Sans nom)";
    assocSelect.appendChild(option);
  });

  // Optionnel : ajouter automatiquement un premier bloc email
  addEmailBlock();
});
import {
  doc, getDoc, getDocs, collection, query, where, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Charger les workflows existants
const workflowContainer = document.getElementById("existing-workflows");
const qWorkflows = query(collection(db, "workflows"), where("userId", "==", user.uid));
const workflowsSnap = await getDocs(qWorkflows);

for (const workflowDoc of workflowsSnap.docs) {
  const wf = workflowDoc.data();
  const div = document.createElement("div");
  div.className = "workflow-item";

  const assocName = wf.associatedId ? `(lié à ${wf.associatedId})` : "(non lié)";
  const emailList = (wf.emails || []).map(email => `📧 ${email.emailId} → J+${email.delayDays}`).join("<br>");

  div.innerHTML = `
    <strong>${wf.name}</strong> <br>
    <em>${assocName}</em><br>
    <div style="margin-top: 0.5rem;">${emailList}</div>
    <div style="margin-top: 1rem;">
      <button class="submit-btn" onclick="editWorkflow('${workflowDoc.id}')">✏️ Modifier</button>
      <button class="remove-btn" onclick="deleteWorkflow('${workflowDoc.id}', this)">🗑️ Supprimer</button>
    </div>
  `;

  workflowContainer.appendChild(div);
}
