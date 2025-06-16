// ✅ VERSION COMPLÈTE avec base fonctionnelle + Make + Upload logo & couleur

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo } from "./upload-media.js";

const auth = getAuth(app);
const db = getFirestore(app);

// 🔗 Webhook Make pour génération automatique
const makeWebhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("🧩 Formulaire affiché");
  });
}

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

if (tunnelType && generalPrice && tunnelPagesSection && addPageBtn && tunnelPages) {
  tunnelType.addEventListener("change", () => {
    const isFull = tunnelType.value === "complet";
    generalPrice.disabled = isFull;
    tunnelPagesSection.style.display = isFull ? "block" : "none";
  });

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
    tunnelPages.appendChild(pageDiv);
  });
}

const form = document.getElementById("tunnel-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🚀 Soumission du formulaire détectée");

    const user = auth.currentUser;
    if (!user) {
      alert("Utilisateur non connecté");
      console.warn("❌ Utilisateur non connecté");
      return;
    }

    const name = document.getElementById("tunnel-name").value;
    const goal = document.getElementById("tunnel-goal").value;
    const type = tunnelType.value;
    const sector = document.getElementById("sector").value;
    const desc = document.getElementById("tunnel-desc").value;
    const cta = document.getElementById("cta-text").value;
    const payment = document.getElementById("payment-url").value;
    const price = generalPrice.value;
    const mainColor = document.getElementById("main-color").value;
    const wantsCustomDomain = customDomainCheckbox.checked;
    const customDomain = wantsCustomDomain ? document.getElementById("custom-domain").value : null;

    const slug = name.toLowerCase().replaceAll(" ", "-");
    const imageFile = document.getElementById("cover-image").files[0];
    const videoFile = document.getElementById("custom-video").files[0];
    const logoFile = document.getElementById("logo").files[0];

    let coverUrl = null;
    let videoUrl = null;
    let logoUrl = null;

    try {
      if (imageFile) {
        console.log("📸 Upload image en cours...");
        coverUrl = await uploadCoverImage(imageFile, slug);
        console.log("✅ Image uploadée :", coverUrl);
      }
      if (videoFile) {
        console.log("🎥 Upload vidéo en cours...");
        videoUrl = await uploadCustomVideo(videoFile, slug);
        console.log("✅ Vidéo uploadée :", videoUrl);
      }
      if (logoFile) {
        console.log("💼 Upload logo en cours...");
        logoUrl = await uploadCoverImage(logoFile, `${slug}-logo`);
        console.log("✅ Logo uploadé :", logoUrl);
      }

      const pages = [];
      if (type === "complet") {
        for (let i = 1; i <= pageCount; i++) {
          const title = form.querySelector(`[name='page-title-${i}']`).value;
          const description = form.querySelector(`[name='page-desc-${i}']`).value;
          const url = form.querySelector(`[name='page-url-${i}']`).value;
          const pagePrice = form.querySelector(`[name='page-price-${i}']`).value;
          pages.push({ title, description, url, price: pagePrice });
        }
      }

      const tunnelData = {
        userId: user.uid,
        name,
        goal,
        type,
        sector,
        desc,
        cta,
        payment,
        price,
        mainColor,
        customDomain,
        coverUrl,
        videoUrl,
        logoUrl,
        pages,
        createdAt: new Date()
      };

      console.log("📂 Données prêtes à être envoyées :", tunnelData);

      const docRef = await addDoc(collection(db, "tunnels"), tunnelData);
      console.log("✅ Tunnel ajouté dans Firestore, ID :", docRef.id);

      const makeResponse = await fetch(makeWebhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...tunnelData,
          email: user.email
        })
      });

      if (makeResponse.ok) {
        console.log("✅ Données envoyées à Make avec succès !");
      } else {
        console.warn("⚠️ Erreur HTTP lors de l'appel Make :", makeResponse.status);
      }

      alert("✅ Tunnel enregistré et génération en cours !");
      form.reset();
      customDomainField.style.display = "none";
      tunnelPages.innerHTML = "";
      tunnelPagesSection.style.display = "none";
      pageCount = 0;
    } catch (err) {
      console.error("❌ Erreur lors de la sauvegarde du tunnel :", err);
      alert("❌ Une erreur s'est produite pendant la création du tunnel.");
    }
  });
}
