// ✅ tunnel-submit.js — version modifiée SANS Firebase Storage, avec envoi direct au Webhook Make

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById("tunnel-form");
const typeField = document.getElementById("tunnel-type");
const dynamicFieldsContainer = document.getElementById("form-content-fields");
const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

let slugCounter = Math.floor(10000 + Math.random() * 90000);

const folderInput = document.getElementById("folderName");
const slugInput = document.getElementById("slug");

if (folderInput) {
  folderInput.addEventListener("input", () => {
    folderInput.value = folderInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });
}

if (slugInput) {
  slugInput.addEventListener("input", () => {
    slugInput.value = slugInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });
}

// La gestion dynamique reste inchangée ici, on passe directement au submit

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const folderName = folderInput?.value || "";
  const slugClean = slugInput?.value.replace(/[^a-zA-Z0-9\-]/g, "") || "";
  const slugFinal = `${slugClean}-${slugCounter}`;

  const checkedFields = Array.from(document.querySelectorAll("input[name='fields']:checked")).map((el) => el.value);

  const formData = new FormData();
  formData.append("userId", user.uid);
  formData.append("folder", folderName);
  formData.append("slug", slugFinal);
  formData.append("name", document.getElementById("tunnel-name")?.value || "");
  formData.append("goal", document.getElementById("tunnel-goal")?.value || "");
  formData.append("sector", document.getElementById("sector")?.value || "");
  formData.append("desc", document.getElementById("tunnel-desc")?.value || "");
  formData.append("cta", document.getElementById("cta-text")?.value || "");
  formData.append("payment", document.getElementById("payment-url")?.value || "");
  formData.append("type", document.getElementById("tunnel-type")?.value || "");
  formData.append("mainColor", document.getElementById("mainColor")?.value || "");
  formData.append("backgroundColor", document.getElementById("backgroundColor")?.value || "");
  formData.append("fields", JSON.stringify(checkedFields));
  formData.append("createdAt", new Date().toLocaleString("fr-FR"));

  const logoFile = document.getElementById("logo")?.files[0];
  const coverFile = document.getElementById("cover-image")?.files[0];
  const videoFile = document.getElementById("custom-video")?.files[0];

  if (logoFile) formData.append("logo", logoFile);
  if (coverFile) formData.append("cover", coverFile);
  if (videoFile) formData.append("video", videoFile);

  try {
    await fetch(webhookURL, {
      method: "POST",
      body: formData,
    });

    await addDoc(collection(db, "tunnels"), {
      userId: user.uid,
      folder: folderName,
      slug: slugFinal,
      name: formData.get("name"),
      goal: formData.get("goal"),
      sector: formData.get("sector"),
      desc: formData.get("desc"),
      cta: formData.get("cta"),
      payment: formData.get("payment"),
      type: formData.get("type"),
      mainColor: formData.get("mainColor"),
      backgroundColor: formData.get("backgroundColor"),
      fields: checkedFields,
      createdAt: formData.get("createdAt"),
      url: `https://cdn.sellyo.fr/${formData.get("type")}/${folderName}/${slugFinal}.html`
    });

    alert("✅ Tunnel envoyé avec succès !");
    form.reset();
  } catch (err) {
    console.error("Erreur d'envoi:", err);
    alert("Erreur lors de l'envoi du tunnel.");
  }
});
