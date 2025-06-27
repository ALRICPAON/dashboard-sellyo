// ✅ tunnel-submit.js — version finale avec compteur unique pour le slug (sans ajouter .html ici) + champs dynamiques personnalisables pour formulaire de capture

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo, uploadLogo } from "./upload-media.js";

const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("tunnel-form");
const typeField = document.getElementById("tunnel-type");
const dynamicFieldsContainer = document.getElementById("form-content-fields");
const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

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

    if (selected === "landing") {
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

        <fieldset style="margin-top: 20px;">
          <legend>Champs à demander dans le formulaire client</legend>
          <label><input type="checkbox" id="ask-name" checked> Nom</label><br>
          <label><input type="checkbox" id="ask-firstname" checked> Prénom</label><br>
          <label><input type="checkbox" id="ask-email" checked> Email</label><br>
          <label><input type="checkbox" id="ask-phone"> Téléphone</label><br>
          <label><input type="checkbox" id="ask-address"> Adresse</label><br>
        </fieldset><br>
      `;
    } else if (selected === "video") {
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
      // inchangé ici
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Non connecté");

    const type = typeField.value;
    if (!type) return alert("Sélectionnez un type de contenu");

    const folder = folderInput?.value || "";
    let slugBase = slugInput?.value || "";
    slugBase = slugBase.replace(/\.html$/i, "").trim();

    const timestamp = Date.now().toString().slice(-5);
    const slug = `${slugBase}-${timestamp}`;

    const name = document.getElementById("tunnel-name")?.value || "";
    const goal = document.getElementById("tunnel-goal")?.value || "";
    const sector = document.getElementById("sector")?.value || "";
    const desc = document.getElementById("tunnel-desc")?.value || "";
    const cta = document.getElementById("cta-text")?.value || "";
    const price = document.getElementById("general-price")?.value || "";
    const payment = document.getElementById("payment-url")?.value || "";
    const mainColor = document.getElementById("mainColor")?.value || "#00ccff";
    const backgroundColor = document.getElementById("backgroundColor")?.value || "#111";

    const logoFile = document.getElementById("logo")?.files[0];
    const coverFile = document.getElementById("cover-image")?.files[0];
    const videoFile = document.getElementById("custom-video")?.files[0];

    const logoUrl = logoFile ? await uploadLogo(logoFile) : null;
    const coverUrl = coverFile ? await uploadCoverImage(coverFile) : null;
    const videoUrl = videoFile ? await uploadCustomVideo(videoFile) : null;

    const askFields = {
      name: document.getElementById("ask-name")?.checked || false,
      firstname: document.getElementById("ask-firstname")?.checked || false,
      email: document.getElementById("ask-email")?.checked || false,
      phone: document.getElementById("ask-phone")?.checked || false,
      address: document.getElementById("ask-address")?.checked || false,
    };

    const payload = {
      userId: user.uid,
      folder,
      slug,
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
      askFields,
      createdAt: new Date().toISOString(),
    };

    // pages tunnel complet inchangé...

    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
