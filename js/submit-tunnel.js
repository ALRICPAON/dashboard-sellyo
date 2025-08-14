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

  // Auth guard (comme avant)
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
    node.querySelector(".page-index").textContent = count + 1;
    pagesContainer.appendChild(node);
    wireRemoveButtons();
  }

  // bouton "ajouter une page" — FIX: bind après DOM prêt
  if (addPageBtn) addPageBtn.addEventListener("click", addPage);

  // première page par défaut — FIX: créer après que le conteneur existe
  addPage();

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

    // Uploads globaux (comme ta version)
    const logoUrl = await uploadIfFile(e.target.logoFile.files[0], `${basePath}logo-${Date.now()}`);
    const coverUrl = await uploadIfFile(e.target.coverFile.files[0], `${basePath}cover-${Date.now()}`);

    const paymentPrice = parseFloat(e.target.payment_price.value || "0") || 0;
    const currency = (e.target.currency.value || "EUR").trim().toUpperCase();
    const paymentLink = (e.target.payment_link.value.trim() || null);
    const fbPixel = (e.target.fb_pixel.value.trim() || null);
    const gtmId = (e.target.gtm_id.value.trim() || null);

    // Pages
    const pagesData = [];
    let index = 0;
    for (const block of pagesContainer.querySelectorAll(".page-block")) {
      index++;
      const g = (name) => block.querySelector(`[name="${name}"]`);

      const heroImageUrl = await uploadIfFile(g("heroImageFile")?.files?.[0], `${basePath}page${index}-hero-${Date.now()}`);
      const videoUrl = await uploadIfFile(g("videoFile")?.files?.[0], `${basePath}page${index}-video-${Date.now()}`);

      const benefits = textToList(g("benefits")?.value);
      const bullets = textToList(g("bullets")?.value);
      let testimonials = [];
      try { testimonials = JSON.parse(g("testimonials")?.value || "[]"); } catch {}
      let faqs = [];
      try { faqs = JSON.parse(g("faqs")?.value || "[]"); } catch {}

      pagesData.push({
        index,
        type: g("type").value,
        filename: `page${index}.html`,
        title: (g("title").value || "").trim(),
        subtitle: (g("subtitle").value || "").trim(),
        heroImage: heroImageUrl,
        videoUrl,
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
          badges: ["Paiement sécurisé", "SSL"]
        },
        timers: {
          deadlineISO: null,
          evergreenMinutes: parseInt(g("evergreenMinutes")?.value || "0", 10) || null
        },
        ctaText: (g("ctaText").value || "Continuer").trim(),
        ctaAction: g("ctaAction").value,
        ctaUrl: (g("ctaUrl").value || "").trim() || null,
        nextFilename: (index < pagesContainer.querySelectorAll(".page-block").length) ? `page${index + 1}.html` : null,
        seo: {
          metaTitle: (g("metaTitle").value || "").trim(),
          metaDescription: (g("metaDescription").value || "").trim()
        }
      });
    }

    // Doc Firestore (comme ta version)
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
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Firestore error", err);
      alert("Erreur lors de l’enregistrement du tunnel.");
      return;
    }

    // Payload Make (identique aux clés que tu avais)
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
      alert("✅ Tunnel en cours de génération.");
      window.location.href = "tunnels.html";
    } catch (err) {
      console.error("Make webhook error", err);
      alert("Erreur d’envoi au scénario Make");
    }
  });
});
