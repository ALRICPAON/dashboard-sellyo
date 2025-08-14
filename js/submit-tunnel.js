import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ⚠️ Mets ici l'URL EXACTE de ton webhook Make (branche tunnel)
const MAKE_WEBHOOK_TUNNEL_URL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

// DOM
const form = document.getElementById("tunnel-form");
const pagesContainer = document.getElementById("pages-container");
const addPageBtn = document.getElementById("add-page-btn");
const tpl = document.getElementById("page-template");

if (!form || !pagesContainer || !addPageBtn || !tpl) {
  console.error("Formulaire tunnel : éléments manquants.");
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Non autorisé");
    window.location.href = "index.html";
    return;
  }
});

// Helpers
function slugify(s) {
  return (s || "")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}

function textToList(v) {
  return (v || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

function wireRemoveButtons() {
  pagesContainer.querySelectorAll(".remove-page").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const block = e.target.closest(".page-block");
      if (block) block.remove();
      // re-index
      [...pagesContainer.querySelectorAll(".page-block .page-index")]
        .forEach((el, i) => el.textContent = i + 1);
    };
  });
}

// Ajoute une première page par défaut
(function initFirstPage() {
  const node = tpl.content.cloneNode(true);
  node.querySelector(".page-index").textContent = 1;
  pagesContainer.appendChild(node);
  wireRemoveButtons();
})();

// Ajouter page
addPageBtn.addEventListener("click", () => {
  const count = pagesContainer.querySelectorAll(".page-block").length;
  if (count >= 8) return alert("Max 8 pages");
  const node = tpl.content.cloneNode(true);
  node.querySelector(".page-index").textContent = count + 1;
  pagesContainer.appendChild(node);
  wireRemoveButtons();
});

// Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const name = e.target.name.value.trim();
  if (!name) {
    alert("Le nom du tunnel est requis.");
    return;
  }

  const desc = e.target.desc.value.trim();
  const redirectURL = e.target.redirectURL.value.trim() || null;
  const mainColor = e.target.mainColor.value.trim() || "#00ccff";
  const logoUrl = e.target.logoUrl.value.trim() || null;
  const coverUrl = e.target.coverUrl.value.trim() || null;

  const paymentPrice = parseFloat(e.target.payment_price.value || "0") || 0;
  const currency = (e.target.currency.value || "EUR").toUpperCase();
  const paymentLink = e.target.payment_link.value.trim() || null;
  const fbPixel = e.target.fb_pixel.value.trim() || null;
  const gtmId = e.target.gtm_id.value.trim() || null;

  // Pages
  const pageBlocks = [...pagesContainer.querySelectorAll(".page-block")];
  if (pageBlocks.length === 0) {
    alert("Ajoute au moins une page.");
    return;
  }

  const pagesData = pageBlocks.map((block, idx) => {
    const g = (name) => block.querySelector(`[name="${name}"]`);
    const index = idx + 1;

    const benefits = textToList(g("benefits")?.value);
    const bullets = textToList(g("bullets")?.value);

    let testimonials = [];
    try { testimonials = JSON.parse(g("testimonials")?.value || "[]"); } catch {}
    let faqs = [];
    try { faqs = JSON.parse(g("faqs")?.value || "[]"); } catch {}

    return {
      index,
      type: g("type").value,
      filename: `page${index}.html`,
      title: g("title").value.trim(),
      subtitle: g("subtitle").value.trim(),
      heroImage: g("heroImage").value.trim() || null,
      videoUrl: g("videoUrl").value.trim() || null,
      copy: {
        problem: g("problem")?.value.trim() || null,
        solution: g("solution")?.value.trim() || null,
        benefits,
        bullets,
        guarantee: g("guarantee")?.value.trim() || null
      },
      testimonials,
      faqs,
      components: {
        timer: g("timerEnabled")?.checked || false,
        progressBar: true,
        badges: ["Paiement sécurisé", "SSL"]
      },
      timers: {
        deadlineISO: null,
        evergreenMinutes: parseInt(g("evergreenMinutes")?.value || "0", 10) || null
      },
      ctaText: g("ctaText").value.trim() || "Continuer",
      ctaAction: g("ctaAction").value,
      ctaUrl: g("ctaUrl").value.trim() || null,
      nextFilename: `page${index + 1}.html`,
      seo: {
        metaTitle: g("metaTitle").value.trim() || "",
        metaDescription: g("metaDescription").value.trim() || ""
      }
    };
  });

  // Slug & URLs
  const slug = slugify(name) || `tunnel-${Date.now()}`;
  const basePath = `tunnels/${user.uid}/${slug}/`;
  const baseUrl = `https://alricpaon.github.io/sellyo-hosting/${basePath}`;
  const firstPageUrl = `${baseUrl}page1.html`;

  // 1) Créer doc Firestore (collection plate = compat liste actuelle)
  let docRef;
  try {
    docRef = await addDoc(collection(db, "tunnels"), {
      userId: user.uid,
      name,
      goal: desc || null,     // compat avec load-tunnels.js (affiche data.goal)
      url: firstPageUrl,      // bouton "Voir"
      type: "tunnel",
      slug,
      basePath,
      baseUrl,
      pagesCount: pagesData.length,
      mainColor,
      logoUrl,
      coverUrl,
      redirectURL,
      currency,
      payment: { provider: "stripe", price: paymentPrice, paymentLink },
      analytics: { fbPixelId: fbPixel, gtmId },
      seo: { siteTitle: name, siteDescription: desc || "" },
      status: "generating",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore addDoc error", err);
    alert("❌ Erreur lors de l’enregistrement Firestore.");
    return;
  }

  // 2) Appeler Make
  const payload = {
    userId: user.uid,
    tunnelDocId: docRef.id,
    name,
    slug,
    desc,
    redirectURL,
    mainColor,
    logoUrl,
    coverUrl,
    currency,
    payment: { provider: "stripe", price: paymentPrice, paymentLink },
    analytics: { fbPixelId: fbPixel, gtmId },
    seo: { siteTitle: name, siteDescription: desc || "" },
    basePath,
    baseUrl,
    pagesCount: pagesData.length,
    pagesData
  };

  try {
    await fetch(MAKE_WEBHOOK_TUNNEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    alert("✅ Tunnel en cours de génération. Redirection vers la liste.");
    window.location.href = "tunnels.html";
  } catch (err) {
    console.error("Make webhook error", err);
    alert("❌ Erreur d’envoi au scénario Make.");
  }
});
