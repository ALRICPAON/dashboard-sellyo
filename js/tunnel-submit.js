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

    generalPrice.disabled = isFull;
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
  form.style.backgroundColor = "#2e2e2e";
  form.style.padding = "2rem";
  form.style.borderRadius = "10px";

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
    const mainColor = document.getElementById("mainColor").value;
    const logoFile = document.getElementById("logo").files[0];
    const price = generalPrice.value;
    const wantsCustomDomain = customDomainCheckbox.checked;
    const customDomain = wantsCustomDomain ? document.getElementById("custom-domain").value : null;

    const relanceCible = document.querySelector("input[name='email-target']:checked")?.value || null;
    const tunnelTargetId = tunnelSelect.value || null;
    const clientTargetEmail = relanceCible === "client" ? clientEmailInput?.value || null : null;

    const slug = name.toLowerCase().replaceAll(" ", "-");
    const imageFile = document.getElementById("cover-image").files[0];
    const videoFile = document.getElementById("custom-video").files[0];

    const redirectURL = `https://sellyo-app.netlify.app/merci.html?from=${slug}`;

    let coverUrl = null;
    let videoUrl = null;
    let logoUrl = null;

    try {
      if (imageFile) {
        coverUrl = await uploadCoverImage(imageFile, slug);
      }
      if (videoFile) {
        videoUrl = await uploadCustomVideo(videoFile, slug);
      }
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile, slug);
      }

      const pages = [];
      if (type === "complet") {
        for (let i = 1; i <= pageCount; i++) {
          const titleEl = form.querySelector(`[name='page-title-${i}']`);
          if (!titleEl) continue;
          const title = titleEl.value;
          const description = form.querySelector(`[name='page-desc-${i}']`).value;
          const url = form.querySelector(`[name='page-url-${i}']`).value;
          const price = form.querySelector(`[name='page-price-${i}']`).value;

          const imageFile = form.querySelector(`[name='page-img-${i}']`).files[0];
          let imageUrl = null;
          if (imageFile) {
            imageUrl = await uploadCoverImage(imageFile, `${slug}-page${i}`);
          }

          pages.push({ title, description, url, price, image: imageUrl });
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
        redirectURL,
        mainColor,
        logoUrl,
        price,
        customDomain,
        coverUrl,
        videoUrl,
        pages,
        relanceCible,
        tunnelTargetId,
        clientTargetEmail,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, "tunnels"), tunnelData);

      await fetch(makeWebhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...tunnelData, email: user.email })
      });

      alert("✅ Tunnel enregistré et génération en cours !");
      form.reset();
      customDomainField.style.display = "none";
      tunnelPages.innerHTML = "";
      tunnelPagesSection.style.display = "none";
      emailTargetingField.style.display = "none";
      pageCount = 0;
    } catch (err) {
      console.error("❌ Erreur lors de la sauvegarde du tunnel :", err);
      alert("❌ Une erreur s'est produite pendant la création du tunnel.");
    }
  });
}
