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

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tunnel-form");
  const pagesContainer = document.getElementById("pages-container");
  const pageTemplate = document.getElementById("page-template");
  const addPageBtn = document.getElementById("add-page-btn");

  let pageCount = 0;

  const addPage = (prefill = {}) => {
    if (pageCount >= 8) return alert("Max 8 pages");
    pageCount++;

    const clone = document.importNode(pageTemplate.content, true);
    const pageEl = clone.querySelector(".page-block");
    pageEl.dataset.index = pageCount;

    clone.querySelector(".page-index").textContent = pageCount;

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
      pageCount--;
    });

    if (prefill.type) typeSelect.value = prefill.type;
    if (prefill.title) clone.querySelector('input[name="title"]').value = prefill.title;
    if (prefill.subtitle) clone.querySelector('input[name="subtitle"]').value = prefill.subtitle;
    if (prefill.objective) clone.querySelector('textarea[name="objective"]').value = prefill.objective;

    typeSelect.dispatchEvent(new Event("change"));
    pagesContainer.appendChild(clone);
  };

  addPage();
  addPageBtn.addEventListener("click", () => addPage());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = await new Promise((resolve) => {
      onAuthStateChanged(auth, (u) => resolve(u));
    });
    if (!user) {
      alert("Veuillez vous reconnecter.");
      return;
    }

    const formData = new FormData(form);

    const tunnelData = {
      userId: user.uid,
      name: formData.get("name")?.trim() || "Tunnel sans nom",
      desc: formData.get("desc")?.trim() || "",
      redirectURL: formData.get("redirectURL")?.trim() || "",
      mainColor: formData.get("mainColor") || "#00ccff",
      buttonColor: formData.get("buttonColor") || "#00ccff",
      payment: {
        price: parseFloat(formData.get("payment_price")) || 0,
        currency: formData.get("currency") || "EUR",
        link: formData.get("payment_link")?.trim() || ""
      },
      tracking: {
        fb_pixel: formData.get("fb_pixel")?.trim() || "",
        gtm_id: formData.get("gtm_id")?.trim() || ""
      },
      delivery: {
        productUrl: "" // sera rempli après upload si besoin
      },
      pages: []
    };

    // 🔹 Upload produit digital si présent
    const productFile = formData.get("digitalProductFile");
    if (productFile && productFile.size > 0) {
      try {
        const ext = productFile.name.split(".").pop();
        const filePath = `tunnels/${user.uid}/${Date.now()}/product.${ext}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, productFile);
        const url = await getDownloadURL(storageRef);
        tunnelData.delivery.productUrl = url.split("?")[0] + "?alt=media";
      } catch (err) {
        console.error("Erreur upload produit digital:", err);
        alert("⚠️ Erreur lors de l'upload du fichier produit.");
        return;
      }
    }

    // 🔹 Pages
    pagesContainer.querySelectorAll(".page-block").forEach((pageEl, idx) => {
      const g = (selector) => pageEl.querySelector(selector);

      const benefits = g('[name="benefits"]').value.split("\n").map((b) => b.trim()).filter(Boolean);
      const bullets = g('[name="bullets"]').value.split("\n").map((b) => b.trim()).filter(Boolean);
      const testimonials = g('[name="testimonials"]').value.trim();
      const faqs = g('[name="faqs"]').value.trim();

      tunnelData.pages.push({
        index: idx + 1,
        type: g('[name="type"]').value,
        filename: `page${idx + 1}.html`,
        title: g('[name="title"]').value.trim(),
        subtitle: g('[name="subtitle"]').value.trim(),
        objective: g('[name="objective"]').value.trim() || null,
        heroImage: null,
        videoUrl: null,
        copy: {
          problem: g('[name="problem"]').value.trim() || null,
          solution: g('[name="solution"]').value.trim() || null,
          benefits,
          bullets,
          guarantee: g('[name="guarantee"]').value.trim() || null
        },
        testimonials: testimonials ? JSON.parse(testimonials) : [],
        faqs: faqs ? JSON.parse(faqs) : [],
        components: {
          timer: g('[name="timerEnabled"]').checked || false,
          progressBar: true,
          badges: ["Paiement sécurisé", "SSL"]
        },
        timers: {
          deadlineISO: null,
          evergreenMinutes: parseInt(g('[name="evergreenMinutes"]').value || "0", 10) || null
        },
        formFields: {
          name: g('[name="formName"]').checked,
          firstname: g('[name="formFirstname"]').checked,
          email: g('[name="formEmail"]').checked,
          phone: g('[name="formPhone"]').checked,
          address: g('[name="formAddress"]').checked
        },
        productRecap: g('[name="productRecap"]')?.value.trim() || "",
        ctaText: g('[name="ctaText"]').value.trim() || "Continuer",
        ctaAction: g('[name="ctaAction"]').value,
        ctaUrl: g('[name="ctaUrl"]').value.trim() || null,
        nextFilename: `page${idx + 2}.html`,
        seo: {
          metaTitle: g('[name="metaTitle"]').value.trim() || "",
          metaDescription: g('[name="metaDescription"]').value.trim() || ""
        }
      });
    });

    // 🔹 Envoi Make.com
    try {
      const makeResp = await fetch("TON_WEBHOOK_MAKE_TUNNEL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tunnelData)
      });

      if (!makeResp.ok) throw new Error("Erreur Make");
      alert("Tunnel envoyé à la génération !");
      window.location.href = "tunnels.html";
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi à Make.");
    }
  });
});
