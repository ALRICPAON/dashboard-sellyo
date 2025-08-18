// js/load-tunnels.js
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

  try {
    const q = query(
      collection(db, "tunnels"),
      where("userId", "==", user.uid),
      where("type", "==", "tunnel")
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = "<p style='opacity:0.6;'>Aucun tunnel trouvé.</p>";
      return;
    }

    let html = "";
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      // 🔁 Calcule l'URL "Voir" (HTML direct) avec fallbacks
      const base = (data.baseUrl || "").replace(/\/$/, "");
      const firstPageSlug = data.firstPageSlug || (data.slug ? `${data.slug}-p1` : "");
      const directHtml = (base && firstPageSlug) ? `${base}/${firstPageSlug}.html` : "";

      // Fallback loader JSON (ancienne version) si on a au moins un slug
      const legacyUrl = data.slug
        ? `optin.html?p=${encodeURIComponent(`${data.slug}-p1`)}&uid=${encodeURIComponent(user.uid)}`
        : "";

      const viewUrl =
        data.viewUrl ||          // 1) champ explicite si déjà stocké
        directHtml ||            // 2) baseUrl + firstPageSlug → HTML GitHub Pages
        data.url ||              // 3) ancien champ éventuel
        legacyUrl ||             // 4) fallback JSON loader
        "";                      // 5) rien → bouton désactivé

      const source =
        (data.viewUrl && "viewUrl") ||
        (directHtml && "baseUrl+firstPageSlug") ||
        (data.url && "legacy:data.url") ||
        (legacyUrl && "legacy:optin") ||
        "none";

      // 👀 Debug console pour savoir quel chemin est utilisé
      console.debug("[Tunnel]", { id, name: data.name, viewUrl, source });

      const disabledAttr = viewUrl ? "" : 'aria-disabled="true" tabindex="-1"';
      const btnClass = viewUrl ? "btn" : "btn disabled";
      const btnHref = viewUrl || "javascript:void(0)";
      const btnTarget = viewUrl ? "_blank" : "_self";

      html += `
        <div class="card">
          <div class="card-content">
            <h3>${data.name || "Sans nom"}</h3>
            <p>${data.goal || "—"}</p>
            <div class="card-buttons">
              <a href="${btnHref}" target="${btnTarget}" rel="noopener" class="${btnClass}" data-source="${source}" ${disabledAttr}>🌐 Voir</a>
              <a href="edit-tunnel.html?id=${id}" class="btn">✏️ Modifier</a>
              <button class="btn btn-danger" data-id="${id}" data-action="delete">🗑 Supprimer</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Délégation d'événement pour supprimer (évite d'attacher un handler par bouton)
    container.addEventListener("click", async (e) => {
      const target = e.target.closest("button[data-action='delete']");
      if (!target) return;
      const id = target.getAttribute("data-id");
      if (!id) return;

      if (confirm("Supprimer ce tunnel ?")) {
        await deleteDoc(doc(db, "tunnels", id));
        location.reload();
      }
    });
  } catch (err) {
    console.error("Erreur chargement tunnels:", err);
    container.innerHTML = "<p style='color:#f55'>Erreur lors du chargement des tunnels.</p>";
  }
});

