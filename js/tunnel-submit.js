// ✅ tunnel-submit.js — version unifiée avec gestion des 4 types de contenu

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { uploadCoverImage, uploadCustomVideo, uploadLogo } from "./upload-media.js";

const auth = getAuth(app);
const form = document.getElementById("tunnel-form");
const typeField = document.getElementById("tunnel-type");
const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

if (form && typeField) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Non connecté");

    const type = typeField.value;
    if (!type) return alert("Sélectionnez un type de contenu");

    const name = document.getElementById("tunnel-name")?.value || "";
    const goal = document.getElementById("tunnel-goal")?.value || "";
    const sector = document.getElementById("sector")?.value || "";
    const desc = document.getElementById("tunnel-desc")?.value || "";
    const cta = document.getElementById("cta-text")?.value || "";
    const price = document.getElementById("general-price")?.value || "";
    const payment = document.getElementById("payment-url")?.value || "";
    const mainColor = document.getElementById("mainColor")?.value || "#00ccff";
    const backgroundColor = document.getElementById("backgroundColor")?.value || "#111";
    const tunnelTargetId = document.getElementById("tunnel-select")?.value || null;

    const logoFile = document.getElementById("logo")?.files[0];
    const coverFile = document.getElementById("cover-image")?.files[0];
    const videoFile = document.getElementById("custom-video")?.files[0];

    const logoUrl = logoFile ? await uploadLogo(logoFile) : null;
    const coverUrl = coverFile ? await uploadCoverImage(coverFile) : null;
    const videoUrl = videoFile ? await uploadCustomVideo(videoFile) : null;

    const payload = {
      userId: user.uid,
      name,
      goal,
      sector,
      desc,
      cta,
      payment,
      type,
      price,
      mainColor,
      backgroundColor,
      logoUrl,
      coverUrl,
      videoUrl,
      tunnelTargetId,
      createdAt: new Date().toISOString()
    };

    if (type === "complet") {
      const pages = [];
      for (let i = 1; i <= 8; i++) {
        const titleEl = form.querySelector(`[name='page-title-${i}']`);
        if (!titleEl) continue;
        pages.push({
          title: titleEl.value,
          description: form.querySelector(`[name='page-desc-${i}']`)?.value || "",
          image: null,
          url: form.querySelector(`[name='page-url-${i}']`)?.value || "",
          price: form.querySelector(`[name='page-price-${i}']`)?.value || ""
        });
      }
      payload.pages = pages;
    }

    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("✅ Contenu envoyé à Make");
      form.reset();
    } catch (err) {
      console.error("❌ Erreur d'envoi:", err);
      alert("Erreur lors de l'envoi du contenu.");
    }
  });
}
