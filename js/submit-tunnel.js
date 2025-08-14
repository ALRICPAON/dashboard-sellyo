// js/submit-tunnel.js
import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const auth = getAuth(app);
const storage = getStorage(app);

// ---------- Helpers ----------
const uploadToStorage = async (userId, path, file) => {
  const storageRef = ref(storage, `tunnels/${userId}/${path}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  // lien stable alt=media
  return url.split("?")[0] + "?alt=media";
};

const safeJSON = (txt) => {
  if (!txt) return [];
  try { return JSON.parse(txt); } catch { return []; }
};

const toSlug = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

const val = (x, fallback = "") => (x == null ? fallback : String(x).trim());
const num = (x, fallback = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
};
const bool = (x) => !!x;

// ---------- Main ----------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tunnel-form");
  const pagesContainer = document.getElementById("pages-container");
  const pageTemplate = document.getElementById("page-template");
  const addPageBtn = document.getElementById("add-page-btn");

  // UI: ajouter une page
  const renumberPages = () => {
    const blocks = [...pagesContainer.querySelectorAll(".page-block")];
    blocks.forEach((el, i) => {
      el.dataset.index = String(i + 1);
      el.querySelector(".page-index").textContent = String(i + 1);
    });
  };

  const addPage = (prefill = {}) => {
    const count = pagesContainer.querySelectorAll(".page-block").length;
    if (count >= 8) return alert("Max 8 pages");

    const clone = document.importNode(pageTemplate.content, true);
    const pageEl = clone.querySelector(".page-block");

    const typeSelect = clone.querySelector('select[name="type"]');
    const optinFields = clone.querySelector(".optin-fields");
    const checkoutFields = clone.querySelector(".checkout-fields");

    typeSelect.addEventListener("change", () => {
      const type = typeSelect.value;
      optinFields.style.display = type === "optin" ? "block" : "none";
      checkoutFields.style.display = type === "checkout" ? "block" : "none";
    });

    clone.querySelector(".remove-page").addEventListener("click", () => {
      pageEl.remove();
      renumberPages();
    });

    // Prefill minimal
    if (prefill.type) typeSelect.value = prefill.type;
    if (prefill.title) clone.querySelector('input[name="title"]').value = prefill.title;
    if (prefill.subtitle) clone.querySelector('input[name="subtitle"]').value = prefill.subtitle;
    if (prefill.objective) clone.querySelector('textarea[name="objective"]').value = prefill.objective;

    pagesContainer.appendChild(clone);
    typeSelect.dispatchEvent(new Event("change"));
    renumberPages();
  };

  // 1 page par défaut
  addPage();

  addPageBtn.addEventListener("click", () => addPage());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = await new Promise((resolve) => onAuthStateChanged(auth, (u) => resolve(u)));
    if (!user) {
      alert("Veuillez vous reconnecter.");
      return;
    }

    const formData = new FormData(form);

    // Slug du tunnel pour organiser le Storage
    const nameRaw = formData.get("name");
    const baseSlug = toSlug(nameRaw) || `tunnel-${Date.now()}`;

    // Meta + branding / tracking / payment
    const tunnelData = {
      userId: user.uid,
      createdAt: new Date().toISOString(),
      version: "v1",
      name: val(nameRaw, "Tunnel sans nom"),
      desc: val(formData.get("desc")),
      redirectURL: val(formData.get("redirectURL")),
      branding: {
        mainColor: val(formData.get("mainColor"), "#00ccff"),
        buttonColor: val(formData.get("buttonColor"), "#00ccff"),
        logoUrl: null,
        coverUrl: null
      },
      payment: {
        price: num(formData.get("payment_price"), 0),
        currency: val(formData.get("currency"), "EUR"),
        link: val(formData.get("payment_link"))
      },
      tracking: {
        fb_pixel: val(formData.get("fb_pixel")),
        gtm_id: val(formData.get("gtm_id"))
      },
      delivery: {
        productUrl: "" // rempli après upload si présent
      },
      pages: []
    };

    // ----- Uploads généraux (logo / cover / product) -----
    try {
      const logoFile = formData.get("logoFile");
      if (logoFile && logoFile.size > 0) {
        const ext = (logoFile.name.split(".").pop() || "png").toLowerCase();
        tunnelData.branding.logoUrl = await uploadToStorage(user.uid, `${baseSlug}/brand/logo.${ext}`, logoFile);
      }

      const coverFile = formData.get("coverFile");
      if (coverFile && coverFile.size > 0) {
        const ext = (coverFile.name.split(".").pop() || "png").toLowerCase();
        tunnelData.branding.coverUrl = await uploadToStorage(user.uid, `${baseSlug}/brand/cover.${ext}`, coverFile);
      }

      const productFile = formData.get("digitalProductFile");
      if (productFile && productFile.size > 0) {
        const ext = (productFile.name.split(".").pop() || "bin").toLowerCase();
        tunnelData.delivery.productUrl = await uploadToStorage(user.uid, `${baseSlug}/delivery/product.${ext}`, productFile);
      }
    } catch (err) {
      console.error("Erreur upload (brand/product):", err);
      alert("⚠️ Erreur lors de l'upload d'un fichier (logo/cover/produit).");
      return;
    }

    // ----- Pages -----
    const pageBlocks = [...pagesContainer.querySelectorAll(".page-block")];
    for (let i = 0; i < pageBlocks.length; i++) {
      const pageEl = pageBlocks[i];
      const g = (sel) => pageEl.querySelector(sel);

      const idx = i + 1;
      const type = val(g('[name="type"]')?.value, "sales");
      const title = val(g('[name="title"]')?.value);
      const subtitle = val(g('[name="subtitle"]')?.value);
      const objective = val(g('[name="objective"]')?.value);
      const problem = val(g('[name="problem"]')?.value);
      const solution = val(g('[name="solution"]')?.value);
      const benefits = val(g('[name="benefits"]')?.value)
        .split("\n").map(s => s.trim()).filter(Boolean);
      const bullets = val(g('[name="bullets"]')?.value)
        .split("\n").map(s => s.trim()).filter(Boolean);
      const guarantee = val(g('[name="guarantee"]')?.value);

      const testimonialsRaw = val(g('[name="testimonials"]')?.value);
      const faqsRaw = val(g('[name="faqs"]')?.value);
      const testimonials = safeJSON(testimonialsRaw);
      const faqs = safeJSON(faqsRaw);

      const timerEnabled = g('[name="timerEnabled"]')?.checked || false;
      const evergreenMinutes = num(g('[name="evergreenMinutes"]')?.value, 0) || null;

      const ctaText = val(g('[name="ctaText"]')?.value, "Continuer");
      const ctaAction = val(g('[name="ctaAction"]')?.value, "next");
      const rawCtaUrl = val(g('[name="ctaUrl"]')?.value);
      const ctaUrl = ctaAction === "url" ? rawCtaUrl : null;

      // optin / checkout blocks
      const formFields = (type === "optin") ? {
        name: !!g('[name="formName"]')?.checked,
        firstname: !!g('[name="formFirstname"]')?.checked,
        email: !!g('[name="formEmail"]')?.checked,
        phone: !!g('[name="formPhone"]')?.checked,
        address: !!g('[name="formAddress"]')?.checked
      } : null;

      const productRecap = (type === "checkout")
        ? val(g('[name="productRecap"]')?.value)
        : null;

      // Uploads par page : hero image / video
      let heroImage = null;
      let videoUrl = null;
      try {
        const heroFile = g('[name="heroImageFile"]')?.files?.[0];
        if (heroFile && heroFile.size > 0) {
          const ext = (heroFile.name.split(".").pop() || "png").toLowerCase();
          heroImage = await uploadToStorage(user.uid, `${baseSlug}/pages/page${idx}/hero.${ext}`, heroFile);
        }
        const videoFile = g('[name="videoFile"]')?.files?.[0];
        if (videoFile && videoFile.size > 0) {
          const ext = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
          videoUrl = await uploadToStorage(user.uid, `${baseSlug}/pages/page${idx}/video.${ext}`, videoFile);
        }
      } catch (err) {
        console.error(`Erreur upload fichiers page ${idx}:`, err);
        alert(`⚠️ Erreur upload sur la page ${idx}.`);
        return;
      }

      const pageData = {
        index: idx,
        type,
        filename: `page${idx}.html`,
        nextFilename: (i < pageBlocks.length - 1) ? `page${idx + 1}.html` : null,
        title,
        subtitle,
        objective: objective || null,
        heroImage,      // URL ou null
        videoUrl,       // URL ou null
        copy: {
          problem: problem || null,
          solution: solution || null,
          benefits,
          bullets,
          guarantee: guarantee || null
        },
        testimonials,
        faqs,
        components: {
          timer: bool(timerEnabled),
          progressBar: true,
          badges: ["Paiement sécurisé", "SSL"]
        },
        timers: {
          deadlineISO: null,
          evergreenMinutes
        },
        formFields,      // null si non-optin
        productRecap,    // null si non-checkout
        ctaText,
        ctaAction,
        ctaUrl,
        seo: {
          metaTitle: val(g('[name="metaTitle"]')?.value),
          metaDescription: val(g('[name="metaDescription"]')?.value)
        }
      };

      tunnelData.pages.push(pageData);
    }

    // ----- Envoi à Make -----
    try {
      const makeResp = await fetch(
        "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tunnelData)
        }
      );

      if (!makeResp.ok) throw new Error(`Erreur Make: ${makeResp.status}`);
      alert("✅ Tunnel envoyé à la génération !");
      window.location.href = "tunnels.html";
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'envoi à Make.");
    }
  });
});
