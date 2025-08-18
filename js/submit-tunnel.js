// js/submit-tunnel.js
import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const MAKE_WEBHOOK_TUNNEL_URL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

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
    const typeSelect = pageEl.querySelector('[name="type"]');

    const titleRow = pageEl.querySelector('[name="title"]')?.closest('label');
    const subtitleRow = pageEl.querySelector('[name="subtitle"]')?.closest('label');
    const heroRow = pageEl.querySelector('[name="heroImageFile"]')?.closest('label');
    const videoRow = pageEl.querySelector('[name="videoFile"]')?.closest('label');
    const productDescRow = pageEl.querySelector('[name="productDescription"]')?.closest('label');
    const productFileRow = pageEl.querySelector('[name="productFile"]')?.closest('label');

    const optinFields = pageEl.querySelector('.optin-fields');
    const thankyouFields = pageEl.querySelector('.thankyou-fields');

    const ctaTextRow = pageEl.querySelector('[name="ctaText"]')?.closest('label');
    const ctaAction = pageEl.querySelector('[name="ctaAction"]');
    const ctaActionRow = ctaAction?.closest('label');
    const ctaUrlRow = pageEl.querySelector('[name="ctaUrl"]')?.closest('label');

    const seoToggle = pageEl.querySelector('.toggle-seo');
    const seoFields = pageEl.querySelector('.seo-fields');

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

    const onChange = () => {
      const t = typeSelect.value;

      // Par défaut on montre presque tout (puis on masque par type)
      show(titleRow, true); setReq(titleRow?.querySelector('input'), false);
      show(subtitleRow, true);
      show(heroRow, true);
      show(videoRow, true);
      show(productDescRow, false);
      show(productFileRow, false);
      show(optinFields, false);
      show(thankyouFields, false);
      show(ctaTextRow, true);
      show(ctaActionRow, true);
      show(ctaUrlRow, true);

      if (t === 'optin') {
        show(optinFields, true);
        if (ctaAction) ctaAction.value = 'next';
        setReq(titleRow?.querySelector('input'), false);
        show(productDescRow, false);
        show(productFileRow, false);
      }

      if (t === 'sales') {
        setReq(titleRow?.querySelector('input'), true);
      }

      if (t === 'checkout') {
        setReq(titleRow?.querySelector('input'), true);
        show(subtitleRow, false);
        show(heroRow, false);
        show(videoRow, false);
        show(productDescRow, true);
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
        show(productFileRow, false);
        show(ctaTextRow, false);
        show(ctaActionRow, false);
        show(ctaUrlRow, false);
        show(thankyouFields, true);
      }

      if (t === 'upsell' || t === 'downsell') {
        setReq(titleRow?.querySelector('input'), true);
      }

      if (t === 'webinar') {
        setReq(titleRow?.querySelector('input'), true);
        show(heroRow, false);
        show(videoRow, true);
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
    if (count >= 8) return alert("Max 8 pages");
    const node = tpl.content.cloneNode(true);
    const el = node.querySelector(".page-block");
    const idx = count + 1;
    node.querySelector(".page-index").textContent = idx;
    pagesContainer.appendChild(node);
    wireRemoveButtons();
    wireTypeToggle(el, idx); // ✅ passe l’index pour gérer SEO par défaut (page 1)
  }

  if (addPageBtn) addPageBtn.addEventListener("click", addPage);
  addPage(); // première page

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const name = e.target.name.value.trim();
    const desc = e.target.desc.value.trim();
    const redirectURL = (e.target.redirectURL.value.trim() || null);
    const mainColor = (e.target.mainColor.value || "#00ccff");
    const buttonColor = (e.target.buttonColor.value || "#00ccff");

    const baseSlug = slugify(name) || "tunnel";
    const uniq = Date.now().toString(36).slice(-5); // ex: "mb4k2"
    const slug = `${baseSlug}-${uniq}`;             // ex: "telephone-mb4k2"

    const siteRoot = "https://alricpaon.github.io/sellyo-hosting"; // 🔵 racine publique (HTML fixes)
    const basePath = `tunnels/${user.uid}/${slug}/`;                // 📦 Storage chemins (uploads)
    const baseUrl  = `${siteRoot}/tunnels/${user.uid}`;             // 🌐 racine publique HTML (pour les pages .html)

    const firstPageSlug = `${slug}-p1`;                              // ✅ première page (p1)
    const viewUrl       = `${baseUrl}/${firstPageSlug}.html`;        // ✅ URL directe de la page 1

    // Uploads globaux
    const logoUrl = await uploadIfFile(e.target.logoFile.files?.[0],  `${basePath}logo-${Date.now()}`);
    const coverUrl = await uploadIfFile(e.target.coverFile.files?.[0], `${basePath}cover-${Date.now()}`);
    const deliveryProductUrl = await uploadIfFile(e.target.digitalProductFile.files?.[0], `${basePath}delivery-product-${Date.now()}`);

    const paymentPrice = parseFloat(e.target.payment_price.value || "0") || 0;
    const currency = (e.target.currency.value || "EUR").trim().toUpperCase();
    const paymentLink = (e.target.payment_link.value.trim() || null);
    const stripePk = (e.target.stripe_pk?.value?.trim() || null);
    const stripePriceId = (e.target.stripe_price_id?.value?.trim() || null);
    const paypalClientId = (e.target.paypal_client_id?.value?.trim() || null);
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

      // Produit par page
      const productFileUrl = await uploadIfFile(g("productFile")?.files?.[0], `${basePath}page${idx}-product-${Date.now()}`);
      const productDescription = (g("productDescription")?.value || "").trim();

      const benefits = textToList(g("benefits")?.value);
      const bullets = textToList(g("bullets")?.value);
      let testimonials = [];
      try { testimonials = JSON.parse(g("testimonials")?.value || "[]"); } catch {}
      let faqs = [];
      try { faqs = JSON.parse(g("faqs")?.value || "[]"); } catch {}

      const type = g("type").value;
      const formFieldsObj = {
        name: !!g("formName")?.checked,
        firstname: !!g("formFirstname")?.checked,
        email: !!g("formEmail")?.checked,
        phone: !!g("formPhone")?.checked,
        address: !!g("formAddress")?.checked
      };
      const isOptin = (type === "optin");
      const isThankyou = (type === "thankyou");
      const thankyouText = isThankyou ? ((g("thankyouText")?.value || "").trim()) : null;

      // Compat checkout : si productDescription renseigné et productRecap vide, on envoie aussi productRecap
      const productRecap = (type === "checkout")
        ? ((g("productRecap")?.value || "").trim() || productDescription || "")
        : ((g("productRecap")?.value || "").trim() || "");

      const evergreenMinutesVal = parseInt(g("evergreenMinutes")?.value || "0", 10) || null;
      const seoToggleChecked = block.querySelector('.toggle-seo')?.checked;
      const seoOn = (typeof seoToggleChecked === 'boolean') ? seoToggleChecked : (idx === 1);
      const metaTitle = (g("metaTitle")?.value || "").trim();
      const metaDescription = (g("metaDescription")?.value || "").trim();

      const pageSlug = `${slug}-p${idx}`;               // ✅ slug unique par page (p1..pN)
      const nextSlug = (idx < blocks.length) ? `${slug}-p${idx+1}` : null;

      const pageObj = {
        index: idx,
        slug: pageSlug,            // ✅ utilisé par Make pour nommer la page .html
        type,
        filename: `page${idx}.html`, // (legacy facultatif)
        title: (g("title").value || "").trim(),
        subtitle: (g("subtitle").value || "").trim(),
        heroImage: heroImageUrl,
        videoUrl,
        media: {
          imageUrl: heroImageUrl || null,
          videoMp4: videoUrl || null
        },
        logoUrl: logoUrl || null,
        // Ajouts livraison produit par page
        productUrl: productFileUrl || null,
        productDescription: productDescription || "",
        copy: {
          problem: (g("problem")?.value || "").trim() || null,
          solution: (g("solution")?.value || "").trim() || null,
          benefits,
          bullets,
          guarantee: (g("guarantee")?.value || "").trim() || null
        },
        testimonials,
        faqs,
        components: {
          timer: !!g("timerEnabled")?.checked,
          progressBar: true,
          badges: ["Paiement sécurisé", "SSL"],
          formFields: isOptin ? formFieldsObj : null
        },
        timers: {
          deadlineISO: null,
          evergreenMinutes: evergreenMinutesVal
        },
        formFields: isOptin ? formFieldsObj : null,
        productRecap,
        thankyouText,
        ctaText: (g("ctaText").value || "Continuer").trim(),
        ctaAction: g("ctaAction").value,
        ctaUrl: (g("ctaUrl").value || "").trim() || null,
        flow: { nextSlug },        // ✅ objet flow propre (slug, pas filename)
        seo: seoOn ? { metaTitle, metaDescription } : { metaTitle: "", metaDescription: "" }
      };

      pagesData.push(pageObj);
    }

    // Doc Firestore (URL d'entrée -> HTML direct .html)
    let docRef;
    try {
      docRef = await addDoc(collection(db, "tunnels"), {
        userId: user.uid,
        name,
        goal: desc || null,
        type: "tunnel",
        slug,
        basePath,                // uploads Storage
        baseUrl,                 // ✅ ex: https://.../tunnels/<uid>
        firstPageSlug,           // ✅ ex: <slug>-p1
        viewUrl,                 // ✅ ex: <baseUrl>/<firstPageSlug>.html
        url: viewUrl,            // (compat ancien code)
        pagesCount: pagesData.length,
        mainColor,
        buttonColor,
        logoUrl,
        coverUrl,
        redirectURL,
        deliveryProductUrl: deliveryProductUrl || null,
        currency,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Firestore error", err);
      alert("Erreur lors de l’enregistrement du tunnel.");
      return;
    }

    // Payload Make (pour génération des pages HTML)
    const payload = {
      userId: user.uid,
      tunnelId: docRef.id,
      name,
      slug,
      desc,
      redirectURL,
      mainColor,
      buttonColor,
      logoUrl,
      coverUrl,
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
      seo: { siteTitle: name, siteDescription: desc || "" },
      delivery: { productUrl: deliveryProductUrl || null },
      basePath,                  // Storage
      baseUrl,                   // ✅ GitHub Pages root pour ce user: /tunnels/<uid>
      pagesCount: pagesData.length,
      pagesData                  // ✅ contient slug (ex: <global-slug>-pN) pour chaque page
    };

    try {
      await fetch(MAKE_WEBHOOK_TUNNEL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("✅ Tunnel en cours de génération.");
      window.location.href = "tunnels.html";
    } catch (err) {
      console.error("Make webhook error", err);
      alert("Erreur d’envoi au scénario Make");
    }
  });
});
