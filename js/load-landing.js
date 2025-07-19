import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const container = document.getElementById("landing-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "tunnels"), where("userId", "==", user.uid), where("type", "==", "landing"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    container.innerHTML = "<p style='opacity: 0.6;'>Aucune landing page trouvée.</p>";
    return;
  }

  let html = '';
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    html += `
      <div style="background:#1e1e1e; padding:1rem; border-radius:12px; box-shadow:0 0 10px rgba(0,0,0,0.4);">
        <h3 style="margin:0 0 0.5rem 0;">${data.name || 'Sans nom'}</h3>
        <p style="margin-bottom:1rem; opacity:0.8;">${data.goal || '—'}</p>
        <a href="${data.url}" target="_blank" style="color:#00ccff; text-decoration:none;">🌐 Voir la page</a>
      </div>
    `;
  });

  container.innerHTML = html;
});
