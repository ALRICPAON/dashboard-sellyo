// ✅ submit-email.js – Script de soumission d'email

import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const webhookURL = "https://hook.eu2.make.com/your-webhook-url"; // à remplacer

  const form = document.getElementById("email-form");
  if (!form) return;

  // 🔄 Fonction pour remplir le menu déroulant dynamique
  async function populateTunnelOptions(userId) {
    const select = document.getElementById("linked-tunnel-id");
    if (!select) return;

    const q = query(collection(db, "tunnels"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const grouped = {
      tunnel: [],
      landing: []
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.type === "tunnel") grouped.tunnel.push(data);
      if (data.type === "landing") grouped.landing.push(data);
    });

    // Ajout des options
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Aucun";
    select.appendChild(defaultOption);

    if (grouped.landing.length > 0) {
      const optgroupLanding = document.createElement("optgroup");
      optgroupLanding.label = "Landing Pages";
      grouped.landing.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.slug || item.name;
        option.textContent = item.slug || item.name;
        optgroupLanding.appendChild(option);
      });
      select.appendChild(optgroupLanding);
    }

    if (grouped.tunnel.length > 0) {
      const optgroupTunnel = document.createElement("optgroup");
      optgroupTunnel.label = "Tunnels complets";
      grouped.tunnel.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.slug || item.name;
        option.textContent = item.slug || item.name;
        optgroupTunnel.appendChild(option);
      });
      select.appendChild(optgroupTunnel);
    }
  }

  onAuthStateChanged(auth, (user) => {
    if (user) populateTunnelOptions(user.uid);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    // Affiche la popup de chargement
    const popup = document.createElement("div");
    popup.id = "email-loading-overlay";
    popup.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;">
        <p>⏳ Génération de votre email…</p>
      </div>`;
    document.body.appendChild(popup);

    // Récupération des champs
    const folder = document.getElementById("folderName")?.value || "";
    const slug = document.getElementById("slug")?.value || "";
    const subject = document.getElementById("email-subject")?.value || "";
    const desc = document.getElementById("email-desc")?.value || "";
    const productLink = document.getElementById("product-link")?.value || "";
    const productPrice = document.getElementById("product-price")?.value || "";
    const file = document.getElementById("attached-file")?.files[0];
    const emailType = document.getElementById("email-type")?.value || "";
    const sendAt = document.getElementById("send-at")?.value || "";
    const linkedTunnelId = document.getElementById("linked-tunnel-id")?.value || "";

    const createdAt = new Date().toISOString();
    const slugFinal = `${slug}-${Math.floor(10000 + Math.random() * 90000)}`;

    const firestoreData = {
      userId: user.uid,
      type: "email",
      folder,
      slug: slugFinal,
      subject,
      desc,
      productLink,
      productPrice,
      emailType,
      sendAt,
      linkedTunnelId,
      createdAt,
      pageUrl: `https://cdn.sellyo.fr/emails/${folder}/${slugFinal}.html`
    };

    const formData = new FormData();
    Object.entries(firestoreData).forEach(([key, val]) =>
      formData.append(key, val)
    );
    if (file) formData.append("file", file);

    try {
      await fetch(webhookURL, { method: "POST", body: formData });
      await addDoc(collection(db, "emails"), firestoreData);
      window.location.href = "tunnels.html";
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
