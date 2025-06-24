// ✅ tunnel-submit.js mis à jour avec choix du type de contenu

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo, uploadLogo } from "./upload-media.js";

const auth = getAuth(app);
const db = getFirestore(app);

const makeWebhookURL = {
  complet: "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp",
  landing: "https://hook.eu2.make.com/YOUR_LANDING_WEBHOOK",
  email: "https://hook.eu2.make.com/YOUR_EMAIL_WEBHOOK",
  video: "https://hook.eu2.make.com/YOUR_VIDEO_WEBHOOK",
};

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const formFull = document.getElementById("form-tunnel-complet");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("📄 Formulaire affiché");
  });
}

document.body.style.backgroundColor = "#111";

const tunnelType = document.getElementById("tunnel-type");
const emailTargetingField = document.getElementById("email-targeting-field");
const tunnelSelect = document.getElementById("tunnel-select");
const clientEmailInput = document.getElementById("client-email");

if (tunnelType) {
  tunnelType.addEventListener("change", async () => {
    const value = tunnelType.value;
    const isFull = value === "complet";
    const isEmail = value === "email";

    document.getElementById("tunnel-form").style.display = isFull ? "none" : "block";
    document.getElementById("form-tunnel-complet").style.display = isFull ? "block" : "none";
    emailTargetingField.style.display = isEmail ? "block" : "none";

    if (isEmail && auth.currentUser) {
      const q = query(collection(db, "tunnels"), where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      tunnelSelect.innerHTML = "";
      querySnapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = doc.data().name;
        tunnelSelect.appendChild(option);
      });
    }
  });
}

// Gestion tunnel complet
let pageCount = 0;
const maxPages = 8;
const addPageFull = document.getElementById("add-page-full");
const tunnelPagesFull = document.getElementById("tunnel-pages-complet");
const submitFullTunnel = document.getElementById("submit-full-tunnel");

if (addPageFull && tunnelPagesFull) {
  addPageFull.addEventListener("click", () => {
    if (pageCount >= maxPages) return;
    pageCount++;
    const pageDiv = document.createElement("div");
    pageDiv.style.marginBottom = "20px";
    pageDiv.innerHTML = `
      <h4>Page ${pageCount}</h4>
      <label>Titre *</label><br>
      <input type="text" name="page-title-${pageCount}" required><br><br>
      <label>Description *</label><br>
      <textarea name="page-desc-${pageCount}" required></textarea><br><br>
      <label>Image</label><br>
      <input type="file" name="page-img-${pageCount}" accept="image/*"><br><br>
      <label>URL produit</label><br>
      <input type="url" name="page-url-${pageCount}"><br><br>
      <label>Prix (€)</label><br>
      <input type="number" name="page-price-${pageCount}" step="0.01"><br><br>
    `;
    tunnelPagesFull.appendChild(pageDiv);
  });
}

if (submitFullTunnel) {
  submitFullTunnel.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("Utilisateur non connecté");

    const pages = [];
    const form = document.getElementById("form-tunnel-complet");
    for (let i = 1; i <= pageCount; i++) {
      const title = form.querySelector(`[name='page-title-${i}']`)?.value || "";
      const description = form.querySelector(`[name='page-desc-${i}']`)?.value || "";
      const url = form.querySelector(`[name='page-url-${i}']`)?.value || "";
      const price = form.querySelector(`[name='page-price-${i}']`)?.value || "";
      const imageFile = form.querySelector(`[name='page-img-${i}']`)?.files[0];
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadCoverImage(imageFile, `full-page-${i}`);
      }
      pages.push({ title, description, url, price, image: imageUrl });
    }

    const dataToSend = {
      userId: user.uid,
      name: "Tunnel complet personnalisé",
      type: "complet",
      pages,
      email: user.email,
      createdAt: new Date()
    };

    try {
      await fetch(makeWebhookURL.complet, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      alert("✅ Tunnel complet envoyé à Make !");
      tunnelPagesFull.innerHTML = "";
      form.style.display = "none";
      pageCount = 0;
    } catch (err) {
      console.error("❌ Erreur lors de l'envoi :", err);
      alert("Erreur lors de la génération du tunnel complet.");
    }
  });
}
