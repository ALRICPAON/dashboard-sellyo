// ✅ VERSION DASHBOARD AVEC BOUTON FONCTIONNEL + FORMULAIRE UNIFIÉ + ROUTAGE TYPE + CORRECTION AFFICHAGE + SUPPORT TUNNEL COMPLET

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo, uploadLogo } from "./upload-media.js";

const auth = getAuth(app);
const db = getFirestore(app);

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const form = document.getElementById("tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && form && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    form.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("🪩 Formulaire affiché");
  });
}

const typeField = document.getElementById("tunnel-type");
const dynamicFieldsContainer = document.getElementById("form-content-fields");
const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

if (form && typeField && dynamicFieldsContainer) {
  typeField.addEventListener("change", async () => {
    const selected = typeField.value;
    dynamicFieldsContainer.innerHTML = "";

    if (selected === "landing" || selected === "video") {
      dynamicFieldsContainer.innerHTML = `
        <label>Nom du contenu *</label><br>
        <input type="text" id="tunnel-name" required><br><br>

        <label>Objectif *</label><br>
        <input type="text" id="tunnel-goal"><br><br>

        <label>Secteur</label><br>
        <input type="text" id="sector"><br><br>

        <label>Prix global</label><br>
        <input type="number" id="general-price"><br><br>

        <label>Logo</label><br>
        <input type="file" id="logo" accept="image/*"><br><br>

        <label>Image de couverture</label><br>
        <input type="file" id="cover-image" accept="image/*"><br><br>

        <label>Vidéo</label><br>
        <input type="file" id="custom-video" accept="video/*"><br><br>

        <label>Description de l’offre *</label><br>
        <textarea id="tunnel-desc" required></textarea><br><br>

        <label>Texte du bouton *</label><br>
        <input type="text" id="cta-text" required><br><br>

        <label>URL du bouton de paiement</label><br>
        <input type="url" id="payment-url"><br><br>
      `;
    } else if (selected === "email") {
      const tunnelSelect = document.createElement("select");
      tunnelSelect.id = "tunnel-select";
      tunnelSelect.required = true;

      if (auth.currentUser) {
        const q = query(collection(db, "tunnels"), where("userId", "==", auth.currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          const opt = document.createElement("option");
          opt.value = doc.id;
          opt.textContent = doc.data().name;
          tunnelSelect.appendChild(opt);
        });
      }

      dynamicFieldsContainer.innerHTML = `
        <label>Nom de la campagne *</label><br>
        <input type="text" id="tunnel-name" required><br><br>

        <label>Message de relance *</label><br>
        <textarea id="tunnel-desc" required></textarea><br><br>

        <label>URL bouton</label><br>
        <input type="url" id="payment-url"><br><br>

        <label>Cibler un tunnel :</label><br>
      `;
      dynamicFieldsContainer.appendChild(tunnelSelect);
    } else if (selected === "complet") {
      dynamicFieldsContainer.innerHTML = `
        <label>Nom du tunnel *</label><br>
        <input type="text" id="tunnel-name" required><br><br>

        <label>Objectif *</label><br>
        <input type="text" id="tunnel-goal"><br><br>

        <label>Secteur</label><br>
        <input type="text" id="sector"><br><br>

        <label>Description globale *</label><br>
        <textarea id="tunnel-desc" required></textarea><br><br>

        <label>Texte du bouton *</label><br>
        <input type="text" id="cta-text" required><br><br>

        <label>URL du bouton de paiement</label><br>
        <input type="url" id="payment-url"><br><br>

        <label>Logo</label><br>
        <input type="file" id="logo" accept="image/*"><br><br>

        <label>Image de couverture</label><br>
        <input type="file" id="cover-image" accept="image/*"><br><br>

        <label>Vidéo</label><br>
        <input type="file" id="custom-video" accept="video/*"><br><br>

        <div id="tunnel-pages-complet" style="margin-top: 2rem;"></div>
        <button type="button" id="add-page-full">+ Ajouter une page</button>
      `;

      const pageContainer = document.getElementById("tunnel-pages-complet");
      const addPageBtn = document.getElementById("add-page-full");

      let pageCount = 0;
      const maxPages = 8;

      addPageBtn.addEventListener("click", () => {
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
        pageContainer.appendChild(pageDiv);
      });
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Non connecté");

    const type = typeField.value;
    if (!type) return alert("Sélectionnez un type de contenu");

    const name = document.getElementById("tunnel-name")?.value || "";
    const goal = document.getElementById("tunnel-goal")?.value || "";
    const sector = document.getElementById("sector")?.value || "";
    const desc = document.getElementById("tunnel-desc")?.value || "";
    const cta = document.getElementById("cta-text")?.value || "";
    const price = document.getElementById("general-price")?.value || "";
    const payment = document.getElementById("payment-url")?.value || "";
    const mainColor = document.getElementById("mainColor")?.value || "#00ccff";
    const backgroundColor = document.getElementById("backgroundColor")?.value || "#111";
    const tunnelTargetId = document.getElementById("tunnel-select")?.value || null;

    const logoFile = document.getElementById("logo")?.files[0];
    const coverFile = document.getElementById("cover-image")?.files[0];
    const videoFile = document.getElementById("custom-video")?.files[0];

    const logoUrl = logoFile ? await uploadLogo(logoFile) : null;
    const coverUrl = coverFile ? await uploadCoverImage(coverFile) : null;
    const videoUrl = videoFile ? await uploadCustomVideo(videoFile) : null;

    const payload = {
      userId: user.uid,
      name,
      goal,
      sector,
      desc,
      cta,
      payment,
      type,
      price,
      mainColor,
      backgroundColor,
      logoUrl,
      coverUrl,
      videoUrl,
      tunnelTargetId,
      createdAt: new Date().toISOString()
    };

    if (type === "complet") {
      const pages = [];
      for (let i = 1; i <= 8; i++) {
        const titleEl = form.querySelector(`[name='page-title-${i}']`);
        if (!titleEl) continue;
        pages.push({
          title: titleEl.value,
          description: form.querySelector(`[name='page-desc-${i}']`)?.value || "",
          image: null,
          url: form.querySelector(`[name='page-url-${i}']`)?.value || "",
          price: form.querySelector(`[name='page-price-${i}']`)?.value || ""
        });
      }
      payload.pages = pages;
    }

    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("✅ Contenu envoyé à Make");
      form.reset();
    } catch (err) {
      console.error("❌ Erreur d'envoi:", err);
      alert("Erreur lors de l'envoi du contenu.");
    }
  });
}
