import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const tbody = document.getElementById("tunnel-leads-body");

const urlParams = new URLSearchParams(window.location.search);
const tunnelId = urlParams.get("tunnelId");

if (!tunnelId) {
  tbody.innerHTML = "<tr><td colspan='4'>❌ Aucun tunnel sélectionné.</td></tr>";
  throw new Error("Aucun tunnelId dans l'URL");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const q = query(
    collection(db, "leads"),
    where("userId", "==", user.uid),
    where("tunnelId", "==", tunnelId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    tbody.innerHTML = "<tr><td colspan='4'>Aucun lead pour ce tunnel.</td></tr>";
    return;
  }

  snapshot.forEach(doc => {
    const data = doc.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding: 0.8rem;">${data.nom || ""}</td>
      <td style="padding: 0.8rem;">${data.prenom || ""}</td>
      <td style="padding: 0.8rem;">${data.email || ""}</td>
      <td style="padding: 0.8rem;">${formatDate(data.createdAt)}</td>
    `;
    tbody.appendChild(tr);
  });
});

function formatDate(dateString) {
  if (!dateString || isNaN(Date.parse(dateString))) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR");
}
