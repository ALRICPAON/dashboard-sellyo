// ✅ tunnel-submit.js – version finale avec redirection via dashboard

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";
  let slugCounter = Math.floor(10000 + Math.random() * 90000);

  const typeField = document.getElementById("tunnel-type");
  const dynamicFieldsContainer = document.getElementById("form-content-fields");
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

  if (typeField && dynamicFieldsContainer) {
    typeField.addEventListener("change", () => {
      const selected = typeField.value;
      dynamicFieldsContainer.innerHTML = "";

      if (["landing", "video"].includes(selected)) {
        dynamicFieldsContainer.innerHTML = `
          <label>Nom du contenu *</label><br>
          <input type="text" id="tunnel-name" name="name" required><br><br>
          <label>Objectif *</label><br>
          <input type="text" id="tunnel-goal" name="goal"><br><br>
          <label>Secteur</label><br>
          <input type="text" id="sector" name="sector"><br><br>
          <label>Logo</label><br>
          <input type="file" id="logo" name="logo" accept="image/*"><br><br>
          <label>Image de couverture</label><br>
          <input type="file" id="cover-image" name="cover" accept="image/*"><br><br>
          <label>Vidéo</label><br>
          <input type="file" id="custom-video" name="video" accept="video/*"><br><br>
          <label>Description de l’offre *</label><br>
          <textarea id="tunnel-desc" name="desc" required></textarea><br><br>
          <label>Texte du bouton *</label><br>
          <input type="text" id="cta-text" name="cta" required><br><br>
          <label>Champs à demander :</label><br>
          <label><input type="checkbox" name="fields" value="nom"> Nom</label>
          <label><input type="checkbox" name="fields" value="prenom"> Prénom</label>
          <label><input type="checkbox" name="fields" value="email"> Email</label>
          <label><input type="checkbox" name="fields" value="telephone"> Téléphone</label>
          <label><input type="checkbox" name="fields" value="adresse"> Adresse</label><br><br>
        `;
      }
    });
  }

  const observer = new MutationObserver(() => {
    const form = document.getElementById("tunnel-form");
    if (!form) return;

    observer.disconnect();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;
      if (!user) {
        alert("Vous devez être connecté.");
        return;
      }

      const type = document.getElementById("tunnel-type")?.value || "tunnel";
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

      const fields = Array.from(document.querySelectorAll("input[name='fields']:checked")).map((el) => ({
        label: el.value.charAt(0).toUpperCase() + el.value.slice(1),
        name: el.value,
        type: el.value === "email" ? "email" : "text",
        placeholder: `Votre ${el.value}`
      }));

      const firestoreData = {
        userId: user.uid,
        name,
        goal,
        sector,
        desc,
        cta,
        type,
        folder,
        slug: slugFinal,
        mainColor,
        backgroundColor,
        createdAt,
        pageUrl: `https://cdn.sellyo.fr/${["landing", "email", "video"].includes(type) ? type : "tunnel"}/${folder}/${slugFinal}.html`,
        fields
      };

      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", name);
      formData.append("goal", goal);
      formData.append("sector", sector);
      formData.append("desc", desc);
      formData.append("cta", cta);
      formData.append("mainColor", mainColor);
      formData.append("backgroundColor", backgroundColor);
      formData.append("userId", user.uid);
      formData.append("folder", folder);
      formData.append("slug", slugFinal);
      formData.append("createdAt", createdAt);
      formData.append("fields", JSON.stringify(fields));

      const logo = document.getElementById("logo")?.files[0];
      const cover = document.getElementById("cover-image")?.files[0];
      const video = document.getElementById("custom-video")?.files[0];

      if (logo) formData.append("logo", logo);
      if (cover) formData.append("cover", cover);
      if (video) formData.append("video", video);

      try {
        await fetch(webhookURL, {
          method: "POST",
          body: formData
        });

        await addDoc(collection(db, "tunnels"), firestoreData);

      // 🔄 Affiche la popup de chargement
const popup = document.createElement("div");
popup.id = "tunnel-loading-overlay";
popup.innerHTML = `
  <div style="
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    font-family: sans-serif;
  ">
    <div class="loader" style="
      border: 6px solid #f3f3f3;
      border-top: 6px solid #00ccff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    "></div>
    <p style="margin-top: 1rem; font-size: 1rem; text-align: center;">
      ⏳ Création de votre tunnel en cours…<br><small>Merci de patienter jusqu’à 2 minutes.</small>
    </p>
  </div>
  <style>
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
`;
document.body.appendChild(popup);

// 🕒 Redirection vers la page des tunnels après 90 secondes max (sécurité si Make prend du temps)
setTimeout(() => {
  window.location.href = "tunnels.html";
}, 90000);

      } catch (err) {
        console.error("❌ Erreur Make ou Firestore :", err);
        alert("Erreur lors de l'envoi : " + err.message);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
