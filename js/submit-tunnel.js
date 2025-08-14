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

  function wireTypeToggle(pageEl) {
    const typeSelect = pageEl.querySelector('[name="type"]');
    const optinFields = pageEl.querySelector(".optin-fields");
    const thankyouFields = pageEl.querySelector(".thankyou-fields");
    const onChange = () => {
      const t = typeSelect.value;
      optinFields.style.display = (t === "optin") ? "block" : "none";
      thankyouFields.style.display = (t === "thankyou") ? "block" : "none";
    };
    typeSelect.addEventListener("change", onChange);
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
    node.querySelector(".page-index").textContent = count + 1;
    pagesContainer.appendChild(node);
    wireRemoveButtons();
    wireTypeToggle(el);
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

    const slug = slugify(name) || `tunnel-${Date.now()}`;
    const basePath = `tunnels/${user.uid}/${slug}/`;
    const baseUrl = `https://alricpaon.github.io/sellyo-hosting/${basePath}`;

    // Uploads globaux
    const logoUrl = await uploadIfFile(e.target.logoFile.files?.[0], `${basePath}logo-${Date.now()}`);
    const coverUrl = await uploadIfFile(e.target.coverFile.files?.[0], `${basePath}cover-${Date.now()}`);
    // Produit digital GLOBAL → delivery.productUrl attendu par ton prompt
    const deliveryProductUrl = await uploadIfFile(e.target.digitalProductFile.files?.[0], `${basePath}delivery-product-${Date.now()}`);

    const paymentPrice = parseFloat(e.target.payment_price.value || "0") || 0;
    const currency = (e.target.currency.value || "EUR").trim().toUpperCase();
    const paymentLink = (e.target.payment_link.value.trim() || null);
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

      const pageObj = {
        index: idx,
        type,
        filename: `page${idx}.html`,
        title: (g("title").value || "").trim(),
        subtitle: (g("subtitle").value || "").trim(),
        heroImage: heroImageUrl,
        videoUrl,
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
          // Compat prompt: certains modèles lisent components.formFields
          formFields: isOptin ? formFieldsObj : null
        },
        timers: {
          deadlineISO: null,
          evergreenMinutes: evergreenMinutesVal
        },
        // Compat prompt: certains modèles lisent formFields à la racine
        formFields: isOptin ? formFieldsObj : null,
        // Compat checkout (déjà existant dans ton prompt)
        productRecap,
        // Thankyou
        thankyouText,
        ctaText: (g("ctaText").value || "Continuer").trim(),
        ctaAction: g("ctaAction").value,
        ctaUrl: (g("ctaUrl").value || "").trim() || null,
        nextFilename: (idx < blocks.length) ? `page${idx + 1}.html` : null,
        seo: {
          metaTitle: (g("metaTitle").value || "").trim(),
          metaDescription: (g("metaDescription").value || "").trim()
        }
      };

      pagesData.push(pageObj);
    }

    // Doc Firestore (identique + on ajoute deliveryProductUrl pour suivi)
    const firstPageUrl = `${baseUrl}page1.html`;
    let docRef;
    try {
      docRef = await addDoc(collection(db, "tunnels"), {
        userId: user.uid,
        name,
        goal: desc || null,
        url: firstPageUrl,
        type: "tunnel",
        slug,
        basePath,
        baseUrl,
        pagesCount: pagesData.length,
        mainColor,
        buttonColor,
        logoUrl,
        coverUrl,
        redirectURL,
        deliveryProductUrl: deliveryProductUrl || null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Firestore error", err);
      alert("Erreur lors de l’enregistrement du tunnel.");
      return;
    }

    // Payload Make (mêmes clés qu’avant + ajouts non bloquants)
    const payload = {
      userId: user.uid,
      tunnelId: docRef.id,
      name,
      desc,
      redirectURL,
      mainColor,
      buttonColor,
      logoUrl,
      coverUrl,
      currency,
      payment: { provider: "stripe", price: parseFloat(e.target.payment_price.value || "0") || 0, paymentLink },
      analytics: { fbPixelId: fbPixel, gtmId },
      seo: { siteTitle: name, siteDescription: desc || "" },
      // Ajout global pour compat avec ton prompt (1.delivery.productUrl)
      delivery: { productUrl: deliveryProductUrl || null },
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
      alert("✅ Tunnel en cours de génération.");
      window.location.href = "tunnels.html";
    } catch (err) {
      console.error("Make webhook error", err);
      alert("Erreur d’envoi au scénario Make");
    }
  });
});
