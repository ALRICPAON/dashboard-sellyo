import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const container = document.getElementById("tunnel-list");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = query(collection(db, "tunnels"), where("userId", "==", user.uid), where("type", "==", "tunnel"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    container.innerHTML = "<p style='opacity: 0.6;'>Aucun tunnel trouvé.</p>";
    return;
  }

  let html = '';
   querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    // 🔁 NEW: calcule l'URL "Voir" (HTML direct) avec fallbacks
    const base = (data.baseUrl || '').replace(/\/$/, '');
    const firstPageSlug = data.firstPageSlug || (data.slug ? `${data.slug}-p1` : '');
    const directHtml = (base && firstPageSlug) ? `${base}/${firstPageSlug}.html` : '';
    const viewUrl =
      data.viewUrl ||                // si déjà stocké en base
      directHtml ||                  // sinon construit à partir de baseUrl + firstPageSlug
      data.url ||                    // fallback éventuel (ancien champ)
      (data.slug ? `optin.html?p=${data.slug}-p1&uid=${user.uid}` : '#'); // dernier recours (loader JSON)

    html += `
      <div class="card">
        <div class="card-content">
          <h3>${data.name || 'Sans nom'}</h3>
          <p>${data.goal || '—'}</p>
          <div class="card-buttons">
            <!-- ⬇️ use viewUrl au lieu de data.url -->
            <a href="${viewUrl}" target="_blank" rel="noopener" class="btn">🌐 Voir</a>
            <a href="edit-tunnel.html?id=${id}" class="btn">✏️ Modifier</a>
            <button class="btn btn-danger" onclick="deleteTunnel('${id}')">🗑 Supprimer</button>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
});

window.deleteTunnel = async function(id) {
  if (confirm("Supprimer ce tunnel ?")) {
    await deleteDoc(doc(db, "tunnels", id));
    location.reload();
  }
};
