import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    const folder = data.folder || "default";
    const file = data.htmlFileName || "index.html";
    const fullUrl = `https://cdn.sellyo.fr/landing/${folder}/${file}`;

    html += `
      <div class="card">
        <div class="card-content">
          <h3>${data.name || 'Sans nom'}</h3>
          <p>${data.goal || '—'}</p>
          <div class="card-buttons">
            <a href="${data.pageUrl}" target="_blank" class="btn">🌐 Voir</a>
            <a href="edit-landing.html?id=${id}" class="btn">✏️ Modifier</a>
            <button class="btn btn-copy" data-url="${fullUrl}">🔗 Copier le lien</button>
            <button class="btn btn-danger" onclick="deleteLanding('${id}')">🗑 Supprimer</button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // 🔁 Ajoute les événements pour copier le lien
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const link = btn.getAttribute("data-url");
      navigator.clipboard.writeText(link).then(() => {
        alert("✅ Lien copié dans le presse-papiers !");
      }).catch(() => {
        alert("❌ Erreur lors de la copie.");
      });
    });
  });
});

window.deleteLanding = async function(id) {
  if (confirm("Supprimer cette landing page ?")) {
    await deleteDoc(doc(db, "tunnels", id));
    location.reload();
  }
};
