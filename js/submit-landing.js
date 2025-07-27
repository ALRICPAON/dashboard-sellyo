import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = document.getElementById("tunnel-form");
  const folderInput = document.getElementById("folderName");
  const slugInput = document.getElementById("slug");

  if (!form) return;

  const slugCounter = Math.floor(10000 + Math.random() * 90000);

  folderInput.addEventListener("input", () => {
    folderInput.value = folderInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });

  slugInput.addEventListener("input", () => {
    slugInput.value = slugInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    const popup = document.createElement("div");
    popup.id = "tunnel-loading-overlay";
    popup.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;text-align:center;padding:2rem;">
        <div class="loader" style="border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite;"></div>
        <p style="margin-top:20px;font-size:18px;">⏳ Génération de votre landing page...<br>Cette opération peut prendre jusqu'à 2 minutes.</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(popup);

    const name = document.getElementById("tunnel-name")?.value || "";
    const goal = document.getElementById("tunnel-goal")?.value || "";
    const sector = document.getElementById("sector")?.value || "";
    const desc = document.getElementById("tunnel-desc")?.value || "";
    const cta = document.getElementById("cta-text")?.value || "";
    const mainColor = document.getElementById("mainColor")?.value || "";
    const backgroundColor = document.getElementById("backgroundColor")?.value || "";
    const folder = folderInput?.value || "";
    const slug = slugInput?.value || "";
    const slugFinal = `${slug}-${slugCounter}`;
    const createdAt = new Date().toISOString();
    const customField = document.getElementById("customField")?.value || "";
    const extraText = document.getElementById("extraText")?.value || "";

    const logo = document.getElementById("logo")?.files[0];
    const cover = document.getElementById("cover-image")?.files[0];
    const video = document.getElementById("custom-video")?.files[0];

    const fields = Array.from(document.querySelectorAll("input[name='fields']:checked")).map((el) => ({
      label: el.value.charAt(0).toUpperCase() + el.value.slice(1),
      name: el.value,
      type: el.value === "email" ? "email" : "text",
      placeholder: `Votre ${el.value}`
    }));

    const docData = {
      userId: user.uid,
      type: "landing",
      name,
      goal,
      sector,
      desc,
      cta,
      mainColor,
      backgroundColor,
      folder,
      slug: slugFinal,
      htmlFileName: `${slugFinal}.html`,
      createdAt,
      pageUrl: `https://cdn.sellyo.fr/landing/${folder}/${slugFinal}.html`,
      fields,
      customField,
      extraText
    };

    try {
      await addDoc(collection(db, "tunnels"), docData);

      // 🔁 Appel Firebase Function (Make)
      const res = await fetch("https://submitmainwebhook-mplcxq32ca-uc.a.run.app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...docData,
          logo: logo?.name || null,
          cover: cover?.name || null,
          video: video?.name || null
        })
      });

      if (!res.ok) throw new Error("Échec de la fonction Cloud");

      setTimeout(() => {
        window.location.href = "https://sellyo.fr/landing";
      }, 90000);

    } catch (err) {
      console.error("❌ Erreur soumission :", err);
      alert("Erreur : " + err.message);
    }
  });
});
