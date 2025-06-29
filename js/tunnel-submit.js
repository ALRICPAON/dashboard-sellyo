import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 tunnel-submit.js chargé !");
  const auth = getAuth(app);
  const db = getFirestore(app);

  const form = document.getElementById("tunnel-form");
  const typeField = document.getElementById("tunnel-type");
  const dynamicFieldsContainer = document.getElementById("form-content-fields");
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";

  let slugCounter = Math.floor(10000 + Math.random() * 90000);
  const folderInput = document.getElementById("folderName");
  const slugInput = document.getElementById("slug");

  if (!form) {
    console.warn("⛔ Formulaire introuvable");
    return;
  }

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
      console.log("🎯 Type de contenu sélectionné :", selected);
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
          <label>URL du bouton (paiement)</label><br>
          <input type="url" id="payment-url" name="payment"><br><br>
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    console.log("👤 Utilisateur connecté :", user);

    if (!user) {
      alert("Vous devez être connecté pour envoyer un tunnel.");
      return;
    }

    const formData = new FormData(form);
    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    const folderName = folderInput?.value ?? "";
    const slugClean = slugInput?.value.replace(/[^a-zA-Z0-9\-]/g, "") ?? "";
    const slugFinal = `${slugClean}-${slugCounter}`;
    const type = formData.get("type") ?? "tunnel";
    const urlPrefix = ["landing", "email", "video"].includes(type) ? type : "tunnel";

    formData.append("userId", user.uid);
    formData.append("folder", folderName);
    formData.append("slug", slugFinal);
    formData.append("createdAt", new Date().toLocaleString("fr-FR"));

    console.log("📦 Envoi vers Make avec :", Object.fromEntries(formData.entries()));

    try {
      await fetch(webhookURL, {
        method: "POST",
        body: formData,
      });

      const firestoreData = {
        userId: user.uid,
        name: formData.get("name") ?? "",
        goal: formData.get("goal") ?? "",
        sector: formData.get("sector") ?? "",
        desc: formData.get("desc") ?? "",
        cta: formData.get("cta") ?? "",
        payment: formData.get("payment") ?? "",
        type: type,
        slug: slugFinal,
        folder: folderName,
        mainColor: formData.get("mainColor") ?? "",
        backgroundColor: formData.get("backgroundColor") ?? "",
        createdAt: new Date().toISOString(),
        fields: formData.getAll("fields") ?? [],
        pageUrl: `https://cdn.sellyo.fr/${urlPrefix}/${folderName}/${slugFinal}.html`,
      };

      console.log("📥 Tentative Firestore avec :", firestoreData);

      await addDoc(collection(db, "tunnels"), firestoreData);

      alert("✅ Tunnel envoyé avec succès !");
      form.reset();
    } catch (err) {
      console.error("❌ Erreur d'envoi Firestore ou Make :", err);
      alert("Erreur lors de l'envoi.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
