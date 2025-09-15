// js/submit-tunnel.js
import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const MAKE_WEBHOOK_TUNNEL_URL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";
// Anti double-submit
let __isSubmitting = false;

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

async function uploadIfFile(file, path) {
  if (!file) return null;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// --- UI de génération (overlay) ---
function showOverlay(on) {
  const ov = document.getElementById('gen-overlay');
  if (!ov) return;
  ov.style.display = on ? 'flex' : 'none';
}

function setPhase1() {
  const step = document.getElementById('gen-step');
  const status = document.getElementById('gen-status');
  const bar = document.getElementById('gen-progress');
  const cdWrap = document.getElementById('gen-countdown-wrap');
  if (step) step.textContent = 'Phase 1/2 — Génération en cours…';
  if (status) status.textContent = 'Envoi à Make et création des pages…';
  if (bar) bar.style.width = '30%';
  if (cdWrap) cdWrap.style.display = 'none';
}

let __phase2Timer = null;
function setPhase2AndCountdown(seconds = 100) { // 90–120s recommandé ; ici ~100s par défaut
  const step = document.getElementById('gen-step');
  const status = document.getElementById('gen-status');
  const bar = document.getElementById('gen-progress');
  const cdWrap = document.getElementById('gen-countdown-wrap');
  const cd = document.getElementById('gen-countdown');

  if (step) step.textContent = 'Phase 2/2 — Assemblage du tunnel…';
  if (status) status.textContent = 'Propagation GitHub Pages, presque fini…';
  if (bar) bar.style.width = '70%';
  if (cdWrap) cdWrap.style.display = '';

  let remain = Math.max(30, Math.min(180, seconds)); // sécurité 30–180s
  if (cd) cd.textContent = `Propagation GitHub Pages : ~${remain}s restantes…`;

  if (__phase2Timer) clearInterval(__phase2Timer);
  __phase2Timer = setInterval(() => {
    remain -= 1;
    if (cd) cd.textContent = `Propagation GitHub Pages : ~${remain}s restantes…`;
    // petite progression visuelle
    if (bar) {
      const p = 70 + Math.min(30, Math.floor(((seconds - remain) / seconds) * 30));
      bar.style.width = p + '%';
    }
    if (remain <= 0) {
      clearInterval(__phase2Timer);
      __phase2Timer = null;
      if (bar) bar.style.width = '100%';
      if (status) status.textContent = 'Terminé ✔︎';
    }
  }, 1000);
}


document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tunnel-form");
  const pagesContainer = document.getElementById("pages-container");
  const addPageBtn = document.getElementById("add-page-btn");
  const tpl = document.getElementById("page-template");

  onAuthStateChanged(auth, user => {
    if (!user) {
      alert("Non autorisé");
      window.location.href = "index.html";
    }
  });

  function renumber() {
    [...pagesContainer.querySelectorAll(".page-block .page-index")]
      .forEach((el, i) => el.textContent = i + 1);
  }

 function wireTypeToggle(pageEl, index) {
  const typeSelect     = pageEl.querySelector('[name="type"]');

  const titleRow       = pageEl.querySelector('[name="title"]')?.closest('label');
  const subtitleRow    = pageEl.querySelector('[name="subtitle"]')?.closest('label');
  const heroRow        = pageEl.querySelector('[name="heroImageFile"]')?.closest('label');
  const videoRow       = pageEl.querySelector('[name="videoFile"]')?.closest('label');
  const productDescRow = pageEl.querySelector('[name="productDescription"]')?.closest('label');

  const optinFields    = pageEl.querySelector('.optin-fields');
  const thankyouFields = pageEl.querySelector('.thankyou-fields');

  const ctaTextRow     = pageEl.querySelector('[name="ctaText"]')?.closest('label');
  const ctaAction      = pageEl.querySelector('[name="ctaAction"]');
  const ctaActionRow   = ctaAction?.closest('label');
  const ctaUrlRow      = pageEl.querySelector('[name="ctaUrl"]')?.closest('label');

  const seoToggle      = pageEl.querySelector('.toggle-seo');
  const seoFields      = pageEl.querySelector('.seo-fields');

  // 👉 Nouveau : toggle pour "Texte & contenu optionnel"
  const extraToggle    = pageEl.querySelector('.toggle-extra');
  const extraFields    = pageEl.querySelector('.extra-fields');

  const setReq = (inputEl, on) => {
    if (!inputEl) return;
    if (on) inputEl.setAttribute('required', '');
    else inputEl.removeAttribute('required');
  };
  const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };

  // SEO: actif par défaut uniquement sur page 1
  if (seoToggle && seoFields) {
    if (typeof index === 'number' && index > 1) {
      seoToggle.checked = false;
      show(seoFields, false);
    } else {
      seoToggle.checked = true;
      show(seoFields, true);
    }
    seoToggle.onchange = () => show(seoFields, seoToggle.checked);
  }

  // branchement toggle extra
  if (extraToggle && extraFields) {
    const updateExtra = () => {
      extraFields.style.display = extraToggle.checked ? '' : 'none';
    };
    extraToggle.addEventListener('change', updateExtra);
    updateExtra();
  }

  const onChange = () => {
    const t = typeSelect.value;

    // Par défaut
    show(titleRow, true); setReq(titleRow?.querySelector('input'), false);
    show(subtitleRow, true);
    show(heroRow, true);
    show(videoRow, true);

    show(optinFields, false);
    show(thankyouFields, false);
    show(ctaTextRow, true);
    show(ctaActionRow, true);
    show(ctaUrlRow, true);

    show(productDescRow, t !== 'thankyou');

    // Extra-fields visibles sauf sur thankyou
    if (t === 'thankyou') {
      show(extraToggle?.closest('label'), false);
      show(extraFields, false);
    } else {
      show(extraToggle?.closest('label'), true);
      if (extraToggle) {
        extraFields.style.display = extraToggle.checked ? '' : 'none';
      }
    }

    if (t === 'optin') {
      show(optinFields, true);
      if (ctaAction) ctaAction.value = 'next';
      setReq(titleRow?.querySelector('input'), false);
    }

    if (t === 'sales') {
      setReq(titleRow?.querySelector('input'), true);
    }

    if (t === 'checkout') {
      setReq(titleRow?.querySelector('input'), true);
      if (ctaAction) ctaAction.value = 'checkout';
      show(ctaUrlRow, false);
    }

    if (t === 'thankyou') {
      show(titleRow, false);
      show(subtitleRow, false);
      show(heroRow, false);
      show(videoRow, false);
      show(optinFields, false);
      show(productDescRow, false);
      show(ctaTextRow, false);
      show(ctaActionRow, false);
      show(ctaUrlRow, false);
      show(thankyouFields, true);
    }
  };

  typeSelect.addEventListener('change', onChange);
  onChange();
}
  function wireRemoveButtons() {
    pagesContainer.querySelectorAll(".remove-page").forEach(btn => {
      btn.onclick = () => {
        btn.closest(".page-block")?.remove();
        renumber();
      };
    });
  }

  function addPage() {
    const count = pagesContainer.querySelectorAll(".page-block").length;
    const node = tpl.content.cloneNode(true);
    const el = node.querySelector(".page-block");
    const idx = count + 1;
    node.querySelector(".page-index").textContent = idx;
    pagesContainer.appendChild(node);
    wireRemoveButtons();
    wireTypeToggle(el, idx);
  }

  if (addPageBtn) addPageBtn.addEventListener("click", addPage);
  addPage(); // première page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    
   // Anti double-clic
if (__isSubmitting) return;
__isSubmitting = true;

// 👉 AJOUT
showOverlay(true);
setPhase1();

    const name = e.target.name.value.trim();
    const redirectURL = (e.target.redirectURL.value.trim() || null);
    const mainColor = (e.target.mainColor.value || "#00ccff");
    const buttonColor = (e.target.buttonColor.value || "#00ccff");

    const baseSlug = slugify(name) || "tunnel";
    const uniq = Date.now().toString(36).slice(-5);
    const slug = `${baseSlug}-${uniq}`;

    const siteRoot = "https://alricpaon.github.io/sellyo-hosting";
    const basePath = `tunnels/${user.uid}/${slug}/`;
    const baseUrl  = `${siteRoot}/tunnels/${user.uid}`;

    const firstPageSlug = `${slug}-p1`;
    const viewUrl       = `${baseUrl}/${firstPageSlug}.html`;

    // Uploads globaux
    const logoUrl = await uploadIfFile(e.target.logoFile?.files?.[0],  `${basePath}logo-${Date.now()}`);
    // (supprimé) coverFile
    const deliveryProductUrl = await uploadIfFile(e.target.digitalProductFile?.files?.[0], `${basePath}delivery-product-${Date.now()}`);

    const paymentPrice = parseFloat(e.target.payment_price.value || "0") || 0;
    const currency = (e.target.currency.value || "EUR").trim().toUpperCase();
    const stripePk = (e.target.stripe_pk?.value?.trim() || null);
    const stripePriceId = (e.target.stripe_price_id?.value?.trim() || null);
    const fbPixel = (e.target.fb_pixel.value.trim() || null);
    const gtmId = (e.target.gtm_id.value.trim() || null);

    // Pages
    const blocks = [...pagesContainer.querySelectorAll(".page-block")];
    const pagesData = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const idx = i + 1;
      const g = (name) => block.querySelector(`[name="${name}"]`);

      const heroImageUrl = await uploadIfFile(g("heroImageFile")?.files?.[0], `${basePath}page${idx}-hero-${Date.now()}`);
      const videoUrl = await uploadIfFile(g("videoFile")?.files?.[0], `${basePath}page${idx}-video-${Date.now()}`);
      

// Champs texte
const benefits      = textToList(g("benefits")?.value);
const bullets       = textToList(g("bullets")?.value);
const testimonials  = textToList(g("testimonials")?.value);
const faqs          = textToList(g("faqs")?.value);

// Form / SEO / flow
const type = g("type").value;
const formFieldsObj = {
  name: !!g("formName")?.checked,
  firstname: !!g("formFirstname")?.checked,
  email: !!g("formEmail")?.checked,
  phone: !!g("formPhone")?.checked,
  address: !!g("formAddress")?.checked,
};
const isOptin = (type === "optin");
const isThankyou = (type === "thankyou");
const thankyouText = isThankyou ? ((g("thankyouText")?.value || "").trim()) : null;

const evergreenMinutesVal = parseInt(g("evergreenMinutes")?.value || "0", 10) || null;
const seoToggleChecked = block.querySelector?.('.toggle-seo')?.checked ?? true;
const seoOn = (typeof seoToggleChecked === 'boolean') ? seoToggleChecked : (idx === 1);
const metaTitle = (g("metaTitle")?.value || "").trim();
const metaDescription = (g("metaDescription")?.value || "").trim();

const pageSlug = `${slug}-p${idx}`;
const nextSlug = (idx < blocks.length) ? `${slug}-p${idx+1}` : null;

// ✅ Ici on ouvre bien l’objet
const pageObj = {
  index: idx,
  slug: pageSlug,
  type,
  filename: `page${idx}.html`,
  title: (g("title").value || "").trim(),
  subtitle: (g("subtitle").value || "").trim(),
  heroImage: heroImageUrl,
  videoUrl,
  media: { imageUrl: heroImageUrl || null, videoMp4: videoUrl || null },
  logoUrl: logoUrl || null,


  copy: {
    problem:  (g("problem")?.value  || "").trim() || null,
    solution: (g("solution")?.value || "").trim() || null,
    benefits,
    bullets,
    guarantee: (g("guarantee")?.value || "").trim() || null,
  },

  testimonials,
  faqs,

  components: {
    timer: !!g("timerEnabled")?.checked,
    progressBar: true,
    badges: ["Paiement sécurisé", "SSL"],
    formFields: isOptin ? formFieldsObj : null,
  },
  timers: {
    deadlineISO: null,
    evergreenMinutes: evergreenMinutesVal,
  },

  formFields: isOptin ? formFieldsObj : null,
  productRecap: (g("productRecap")?.value || "").trim() || "",
  thankyouText,
  ctaText: (g("ctaText").value || "Continuer").trim(),
  ctaAction: g("ctaAction").value,
  ctaUrl: (g("ctaUrl").value || "").trim() || null,
  flow: { nextSlug },
  seo: seoOn ? { metaTitle, metaDescription } : { metaTitle: "", metaDescription: "" },
}; // 👈 fermeture de l’objet

pagesData.push(pageObj);
} // 👈 ferme la boucle for (let i = 0; i < blocks.length; i++)

// ✅ Merci obligatoire si produit global (fichier OU URL)
const hasGlobalProduct = !!redirectURL || !!deliveryProductUrl;
const hasThankYouPage = pagesData.some(p => p.type === "thankyou");

if (hasGlobalProduct && !hasThankYouPage) {
  alert("⚠️ Tu dois ajouter une page de remerciement pour livrer ton produit (fichier global ou URL).");
  __isSubmitting = false;
  return;
}

    // Doc Firestore (vue d’ensemble)
    let docRef;
    try {
      docRef = await addDoc(collection(db, "tunnels"), {
        userId: user.uid,
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
        redirectURL,
        deliveryProductUrl: deliveryProductUrl || null,
        deliveryGlobal: {
  fileUrl: deliveryProductUrl || null,
  url: redirectURL || null
},
        currency,
        createdAt: serverTimestamp()
      });
    } catch (err) {
  console.error("Firestore error", err);
  alert("Erreur lors de l’enregistrement du tunnel.");
  __isSubmitting = false;
  showOverlay(false); // ← AJOUT
  return;
}

    // Payload Make (génération HTML)
    const payload = {
      userId: user.uid,
      tunnelId: docRef.id,
      name,
      slug,
      redirectURL,
      mainColor,
      buttonColor,
      logoUrl,
      currency,
      payment: {
        provider: "stripe",
        price: paymentPrice,
        paymentLink,
        stripePublishableKey: stripePk,
        stripePriceId: stripePriceId,
        paypalClientId: paypalClientId
      },
      analytics: { fbPixelId: fbPixel, gtmId },
      seo: { siteTitle: name, siteDescription: "" },
      delivery: {
  fileUrl: deliveryProductUrl || null,
  url: redirectURL || null,
  productUrl: deliveryProductUrl || redirectURL || null
},
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

// Phase 2 : assemblage / propagation GitHub Pages (90–120s conseillé)
setPhase2AndCountdown(100); // tu peux mettre 90, 100 ou 120

// Redirection automatique vers la première page à la fin (fallback 100s + 2s de marge)
setTimeout(() => {
  // on coupe l’overlay juste au moment de partir
  showOverlay(false);
  window.location.href = viewUrl; // ex: https://.../<slug>-p1.html
}, 102000); // 100s + 2s
    
    } catch (err) {
  console.error("Make webhook error", err);
  alert("Erreur d’envoi au scénario Make");
  __isSubmitting = false;
  showOverlay(false); // ← AJOUT
}
  });
});
