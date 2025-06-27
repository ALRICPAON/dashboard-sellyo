// ✅ tunnel-submit.js — version finale avec compteur, mapping correct et envoi vers Make

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

let slugCounter = Math.floor(10000 + Math.random() * 90000); // compteur simple à 5 chiffres

// Nettoyage folderName & slug
const folderInput = document.getElementById("folderName");
const slugInput = document.getElementById("slug");

if (folderInput) {
  folderInput.addEventListener("input", () => {
    folderInput.value = folderInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });
}

if (slugInput) {
  slugInput.addEventListener("input", () => {
    slugInput.value = slugInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
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

        <label>Champs à demander :</label><br>
        <label><input type="checkbox" name="fields" value="nom"> Nom</label>
        <label><input type="checkbox" name="fields" value="prenom"> Prénom</label>
        <label><input type="checkbox" name="fields" value="email"> Email</label>
        <label><input type="checkbox" name="fields" value="telephone"> Téléphone</label>
        <label><input type="checkbox" name="fields" value="adresse"> Adresse</label><br><br>
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
}

// 🔁 Ajout automatique de .html + compteur pour unicité
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const folderName = folderInput?.value || "";
  const slugClean = slugInput?.value.replace(/[^a-zA-Z0-9\-]/g, "") || "";
  const slugFinal = `${slugClean}-${slugCounter}`;

  const payload = {
    userId: user.uid,
    folder: folderName,
    slug: `${slugFinal}.html`,
    name: document.getElementById("tunnel-name")?.value || "",
    goal: document.getElementById("tunnel-goal")?.value || "",
    sector: document.getElementById("sector")?.value || "",
    desc: document.getElementById("tunnel-desc")?.value || "",
    cta: document.getElementById("cta-text")?.value || "",
    payment: document.getElementById("payment-url")?.value || "",
    type: document.getElementById("tunnel-type")?.value || "",
    mainColor: document.getElementById("mainColor")?.value || "",
    backgroundColor: document.getElementById("backgroundColor")?.value || "",
    createdAt: new Date().toLocaleString("fr-FR"),
  };

  try {
    await fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    alert("✅ Tunnel envoyé avec succès !");
    form.reset();
  } catch (err) {
    console.error("Erreur d'envoi:", err);
    alert("Erreur lors de l'envoi du tunnel.");
  }
});
