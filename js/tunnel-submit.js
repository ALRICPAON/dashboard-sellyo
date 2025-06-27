// ✅ tunnel-submit.js — version corrigée avec suppression des doublons de folderName/slug + validation slug

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo, uploadLogo } from "./upload-media.js";

const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("tunnel-form");
const typeField = document.getElementById("tunnel-type");
const dynamicFieldsContainer = document.getElementById("form-content-fields");
const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

// Empêcher les caractères non valides dans folderName et slug
const folderInput = document.getElementById("folderName");
const slugInput = document.getElementById("slug");

if (folderInput) {
  folderInput.addEventListener("input", (e) => {
    folderInput.value = folderInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });
}

if (slugInput) {
  slugInput.addEventListener("input", (e) => {
    slugInput.value = slugInput.value.replace(/[^a-zA-Z0-9\-\.]/g, "");
  });
}

if (form && typeField && dynamicFieldsContainer) {
  typeField.addEventListener("change", () => {
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
      dynamicFieldsContainer.innerHTML = `
        <label>Nom de la campagne *</label><br>
        <input type="text" id="tunnel-name" required><br><br>

        <label>Message de relance *</label><br>
        <textarea id="tunnel-desc" required></textarea><br><br>

        <label>URL bouton</label><br>
        <input type="url" id="payment-url"><br><br>
      `;
    } else if (selected === "complet") {
      dynamicFieldsContainer.innerHTML = `
        <label>Nom du tunnel *</label><br>
        <input type="text" id="tunnel-name" required><br><br>

        <label>Objectif *</label><br>
        <input type="text" id="tunnel-goal"><br><br>

        <label>Secteur</label><br>
        <input type="text" id="sector"><br><br>

        <label>Logo</label><br>
        <input type="file" id="logo" accept="image/*"><br><br>

        <label>Vidéo principale</label><br>
        <input type="file" id="custom-video" accept="video/*"><br><br>

        <label>Description de l’offre *</label><br>
        <textarea id="tunnel-desc" required></textarea><br><br>

        <label>Texte du bouton *</label><br>
        <input type="text" id="cta-text" required><br><br>

        <label>URL du bouton (paiement)</label><br>
        <input type="url" id="payment-url"><br><br>

        <div id="tunnel-pages-complet"></div>
        <button type="button" id="add-page-full">+ Ajouter une page</button><br><br>
      `;

      let pageCount = 0;
      const maxPages = 8;
      const tunnelPages = document.getElementById("tunnel-pages-complet");
      const addPageBtn = document.getElementById("add-page-full");

      if (addPageBtn && tunnelPages) {
        addPageBtn.addEventListener("click", () => {
          if (pageCount >= maxPages) return;
          pageCount++;
          const page = document.createElement("div");
          page.innerHTML = `
            <h4>Page ${pageCount}</h4>
            <label>Titre *</label><br>
            <input type="text" name="page-title-${pageCount}" required><br><br>
            <label>Description *</label><br>
            <textarea name="page-desc-${pageCount}" required></textarea><br><br>
            <label>URL produit</label><br>
            <input type="url" name="page-url-${pageCount}"><br><br>
            <label>Lien de paiement</label><br>
            <input type="url" name="page-payment-${pageCount}"><br><br>
            <label>Prix (€)</label><br>
            <input type="number" name="page-price-${pageCount}" step="0.01"><br><br>
            <label>Image</label><br>
            <input type="file" name="page-image-${pageCount}" accept="image/*"><br><br>
            <label>Vidéo</label><br>
            <input type="file" name="page-video-${pageCount}" accept="video/*"><br><br>
          `;
          tunnelPages.appendChild(page);
        });
      }
    }
  });
} // le reste du script (envoi du webhook) reste inchangé
