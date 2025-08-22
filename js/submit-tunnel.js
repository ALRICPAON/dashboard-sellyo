import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tunnel-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Empêcher double clic
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    // Récupération des données du formulaire
    const name = form.name.value.trim();
    const slug = form.slug.value.trim();
    const mainColor = form.mainColor.value || "#0b1220";
    const buttonColor = form.buttonColor.value || "#3b82f6";
    const logoUrl = form.logoUrl.value || null;

    // Produits globaux
    const deliveryProductUrl = form.deliveryProductUrl?.value?.trim() || null; // Lien externe
    const digitalProductFile = form.digitalProductFile?.value?.trim() || null; // Fichier uploadé

    // Paiement / Stripe / PayPal
    const paymentPrice = form.paymentPrice?.value || null;
    const paymentLink = form.paymentLink?.value || null;
    const stripePk = form.stripePk?.value || null;
    const stripePriceId = form.stripePriceId?.value || null;
    const paypalClientId = form.paypalClientId?.value || null;
    const fbPixel = form.fbPixel?.value || null;
    const gtmId = form.gtmId?.value || null;
    const currency = form.currency?.value || "EUR";

    // Récupération des pages du tunnel
    const pagesData = collectPagesData();
    if (!pagesData || pagesData.length === 0) {
      alert("⚠️ Ajoute au moins une page à ton tunnel.");
      submitBtn.disabled = false;
      return;
    }

    // Vérification si produit global => page thankyou obligatoire
    const hasGlobalProduct = !!digitalProductFile || !!deliveryProductUrl;
    const hasThankYou = pagesData.some(p => p.type === "thankyou");

    if (hasGlobalProduct && !hasThankYou) {
      alert("⚠️ Tu dois ajouter une page de remerciement pour livrer ton produit.");
      submitBtn.disabled = false;
      return;
    }

    // Construction des chemins pour GitHub Pages
    const basePath = `tunnels/${auth.currentUser.uid}/${slug}`;
    const baseUrl = `https://alricpaon.github.io/sellyo-hosting/${basePath}`;
    const firstPageSlug = pagesData[0].slug;
    const viewUrl = `${baseUrl}/${firstPageSlug}.html`;

    // Sauvegarde Firestore
    let docRef;
    try {
      docRef = await addDoc(collection(db, "tunnels"), {
        userId: auth.currentUser.uid,
        name,
        type: "tunnel",
        slug,
        basePath,
        baseUrl,
        firstPageSlug,
        viewUrl,
        url: viewUrl, // legacy
        pagesCount: pagesData.length,
        mainColor,
        buttonColor,
        logoUrl,
        deliveryProductUrl: deliveryProductUrl || null,
        digitalProductFile: digitalProductFile || null, // ✅ Ajouté ici
        currency,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Firestore error", err);
      alert("Erreur lors de l’enregistrement du tunnel.");
      submitBtn.disabled = false;
      return;
    }

    // Construction du payload pour Make (Génération HTML)
    const payload = {
      userId: auth.currentUser.uid,
      tunnelId: docRef.id,
      name,
      slug,
      mainColor,
      buttonColor,
      logoUrl,
      currency,
      payment: {
        provider: "stripe",
        price: paymentPrice,
        paymentLink,
        stripePublishableKey: stripePk,
        stripePriceId,
        paypalClientId
      },
      analytics: { fbPixelId: fbPixel, gtmId },
      seo: { siteTitle: name, siteDescription: "" },
      delivery: {
        productUrl: deliveryProductUrl || null,
        digitalProductFile: digitalProductFile || null // ✅ Ajout Make
      },
      basePath,
      baseUrl,
      pagesCount: pagesData.length,
      pagesData
    };

    // Envoi du payload à Make via webhook
    try {
      const webhookUrl = MAKE_WEBHOOK_URL; // Vérifie que ta constante est bien définie
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Erreur Make : ${response.status}`);

      alert("✅ Tunnel généré avec succès !");
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Make error", err);
      alert("Erreur lors de la génération du tunnel.");
      submitBtn.disabled = false;
    }
  });
});

// Fonction qui collecte les données des pages du tunnel
function collectPagesData() {
  const pagesContainer = document.getElementById("pages-container");
  const pages = [];
  pagesContainer.querySelectorAll(".page-item").forEach((page) => {
    const slug = page.querySelector(".page-slug").value.trim();
    const type = page.querySelector(".page-type").value;
    const productFile = page.querySelector(".product-file")?.value || null;

    pages.push({ slug, type, productFile });
  });
  return pages;
}
