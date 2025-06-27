// ✅ tunnel-submit.js — version complète mise à jour

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

if (form && typeField && dynamicFieldsContainer) {
  // Ajout des champs folderName et slug globaux (hors changement de type)
  const folderSlugFields = document.createElement("div");
  folderSlugFields.innerHTML = `
    <label>Identifiant public (ex: nom marque, sans espace ni accent) *</label><br>
    <input type="text" id="folderName" pattern="[a-zA-Z0-9\-]+" title="Pas d'espace, uniquement lettres, chiffres et tirets" required><br><br>

    <label>Nom de la page (ex: tunnel.html) *</label><br>
    <input type="text" id="slug" pattern="[a-zA-Z0-9\-]+\\.html" title="Ex: tunnel.html ou offre-speciale.html" required><br><br>
  `;
  form.insertBefore(folderSlugFields, dynamicFieldsContainer);

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

        <label>Couleur du bouton</label><br>
        <input type="color" id="mainColor" value="#00ccff"><br><br>

        <label>Couleur de fond</label><br>
        <input type="color" id="backgroundColor" value="#111"><br><br>

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

    const folderName = document.getElementById("folderName")?.value.trim();
    const slug = document.getElementById("slug")?.value.trim();

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
      folderName,
      slug,
      createdAt: new Date().toISOString(),
    };

    if (type === "complet") {
      const pages = [];

      for (let i = 1; i <= 8; i++) {
        const title = document.querySelector(`[name='page-title-${i}']`)?.value;
        if (!title) continue;
        const description = document.querySelector(`[name='page-desc-${i}']`)?.value || "";
        const url = document.querySelector(`[name='page-url-${i}']`)?.value || "";
        const paymentUrl = document.querySelector(`[name='page-payment-${i}']`)?.value || "";
        const price = document.querySelector(`[name='page-price-${i}']`)?.value || "";

        const imageFile = document.querySelector(`[name='page-image-${i}']`)?.files?.[0];
        const videoFile = document.querySelector(`[name='page-video-${i}']`)?.files?.[0];

        const imageUrl = imageFile ? await uploadCoverImage(imageFile) : null;
        const videoUrl = videoFile ? await uploadCustomVideo(videoFile) : null;

        pages.push({ title, description, url, price, paymentUrl, imageUrl, videoUrl });
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
      document.getElementById("tunnel-pages-complet").innerHTML = "";
    } catch (err) {
      console.error("❌ Erreur d'envoi:", err);
      alert("Erreur lors de l'envoi du contenu.");
    }
  });
}
