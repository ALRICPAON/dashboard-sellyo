// ✅ VERSION COMPLÈTE avec base fonctionnelle + Make + Logs + Mail targeting + UI tweaks + Upload image pages personnalisées

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo, uploadLogo } from "./upload-media.js";

const auth = getAuth(app);
const db = getFirestore(app);

const makeWebhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("📄 Formulaire affiché");
  });
}

document.body.style.backgroundColor = "#111";

const customDomainCheckbox = document.getElementById("use-custom-domain");
const customDomainField = document.getElementById("custom-domain-field");
if (customDomainCheckbox && customDomainField) {
  customDomainCheckbox.addEventListener("change", () => {
    customDomainField.style.display = customDomainCheckbox.checked ? "block" : "none";
  });
}

const tunnelType = document.getElementById("tunnel-type");
const generalPrice = document.getElementById("general-price");
const tunnelPagesSection = document.getElementById("tunnel-pages-section");
const tunnelPages = document.getElementById("tunnel-pages");
const addPageBtn = document.getElementById("add-page");
const emailTargetingField = document.getElementById("email-targeting-field");
const tunnelSelectContainer = document.getElementById("tunnel-select-container");
const tunnelSelect = document.getElementById("tunnel-select");
const clientEmailContainer = document.getElementById("client-email-container");
const clientEmailInput = document.getElementById("client-email");

let pageCount = 0;
const maxPages = 8;

if (tunnelType && generalPrice && tunnelPagesSection && addPageBtn && tunnelPages) {
  tunnelType.addEventListener("change", async () => {
    const value = tunnelType.value;
    const isFull = value === "complet";
    const isEmail = value === "email";

    const fieldContainers = document.querySelectorAll("#tunnel-form > *");
    fieldContainers.forEach(el => {
      if (!el.closest("#tunnel-pages-section") && !el.closest("#email-targeting-field") && el.id !== "tunnel-type") {
        el.style.display = isFull ? "none" : "block";
      }
    });

    tunnelPagesSection.style.display = isFull ? "block" : "none";
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

  addPageBtn.addEventListener("click", () => {
    if (pageCount >= maxPages) return;
    pageCount++;

    const pageDiv = document.createElement("div");
    pageDiv.style.marginBottom = "20px";
    pageDiv.innerHTML = `
      <h4>Page ${pageCount}</h4>
      <label>Nom du tunnel *</label><br>
      <input type="text" name="page-title-${pageCount}" required><br><br>
      <label>Objectif du tunnel *</label><br>
      <textarea name="page-desc-${pageCount}" required></textarea><br><br>
      <label>Secteur d’activité</label><br>
      <input type="text" name="page-sector-${pageCount}"><br><br>
      <label>Image</label><br>
      <input type="file" name="page-img-${pageCount}" accept="image/*"><br><br>
      <label>Vidéo à intégrer</label><br>
      <input type="file" name="page-video-${pageCount}" accept="video/*"><br><br>
      <label>Couleur principale</label><br>
      <input type="color" name="page-color-${pageCount}" value="#ff9900"><br><br>
      <label>Logo de votre marque</label><br>
      <input type="file" name="page-logo-${pageCount}" accept="image/*"><br><br>
      <label>Description de l’offre *</label><br>
      <textarea name="page-offer-${pageCount}" required></textarea><br><br>
      <label>Texte du bouton *</label><br>
      <input type="text" name="page-cta-${pageCount}" required><br><br>
      <label>URL du bouton de paiement</label><br>
      <input type="url" name="page-url-${pageCount}"><br><br>
      <label>Prix (€)</label><br>
      <input type="number" name="page-price-${pageCount}" step="0.01"><br><br>
    `;
    tunnelPages.appendChild(pageDiv);
  });
}
