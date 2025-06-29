import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 tunnel-submit.js chargé");

  const auth = getAuth(app);
  const db = getFirestore(app);
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

  if (typeField && dynamicFieldsContainer) {
    typeField.addEventListener("change", () => {
      const selected = typeField.value;
      console.log("📌 Type sélectionné :", selected);
      dynamicFieldsContainer.innerHTML = "";

      if (selected === "landing") {
        dynamicFieldsContainer.innerHTML = `
          <label>Nom du contenu *</label><br>
          <input type="text" id="tunnel-name" name="name" required placeholder="ex: Formation gratuite"><br><br>
          <label>Objectif *</label><br>
          <input type="text" id="tunnel-goal" name="goal" placeholder="ex: Collecter des emails pour une offre"><br><br>
          <label>Secteur</label><br>
          <input type="text" id="sector" name="sector" placeholder="ex: Coaching, immobilier, santé..."><br><br>
          <label>Logo</label><br>
          <input type="file" id="logo" name="logo" accept="image/*"><br><br>
          <label>Image de couverture</label><br>
          <input type="file" id="cover-image" name="cover" accept="image/*"><br><br>
          <label>Description de l’offre *</label><br>
          <textarea id="tunnel-desc" name="desc" required placeholder="ex: Découvrez notre méthode pas à pas pour générer vos premiers clients"></textarea><br><br>
          <label>Texte du bouton *</label><br>
          <input type="text" id="cta-text" name="cta" required placeholder="ex: Je m'inscris / Je télécharge"><br><br>
          <label>Champs à demander :</label><br>
          <label><input type="checkbox" name="fields" value="nom"> Nom</label>
          <label><input type="checkbox" name="fields" value="prenom"> Prénom</label>
          <label><input type="checkbox" name="fields" value="email"> Email</label>
          <label><input type="checkbox" name="fields" value="telephone"> Téléphone</label>
          <label><input type="checkbox" name="fields" value="adresse"> Adresse</label><br><br>
        `;
      } else if (selected === "video") {
        dynamicFieldsContainer.innerHTML = `
          <label>Nom du contenu *</label><br>
          <input type="text" id="tunnel-name" name="name" required placeholder="ex: Vidéo promotionnelle IA"><br><br>
          <label>Objectif *</label><br>
          <input type="text" id="tunnel-goal" name="goal" placeholder="ex: Convaincre avec une vidéo persuasive"><br><br>
          <label>Secteur</label><br>
          <input type="text" id="sector" name="sector" placeholder="ex: E-commerce, finance, etc."><br><br>
          <label>Logo</label><br>
          <input type="file" id="logo" name="logo" accept="image/*"><br><br>
          <label>Image de couverture</label><br>
          <input type="file" id="cover-image" name="cover" accept="image/*"><br><br>
          <label>Vidéo</label><br>
          <input type="file" id="custom-video" name="video" accept="video/*"><br><br>
          <label>Description de l’offre *</label><br>
          <textarea id="tunnel-desc" name="desc" required placeholder="ex: Cette vidéo montre comment booster vos ventes"></textarea><br><br>
          <label>Texte du bouton *</label><br>
          <input type="text" id="cta-text" name="cta" required placeholder="ex: Voir la vidéo"><br><br>
          <label>URL du bouton (paiement)</label><br>
          <input type="url" id="payment-url" name="payment" placeholder="ex: https://votresite.com/checkout"><br><br>
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

      const formData = new FormData(form);
      const folderName = folderInput?.value || "";
      const slugClean = slugInput?.value.replace(/[^a-zA-Z0-9\-]/g, "") || "";
      const slugFinal = `${slugClean}-${slugCounter}`;
      const type = document.getElementById("tunnel-type")?.value || "tunnel";
      const urlPrefix = ["landing", "email", "video"].includes(type) ? type : "tunnel";

      formData.set("type", type);
      formData.set("name", document.getElementById("tunnel-name")?.value || "");
      formData.set("goal", document.getElementById("tunnel-goal")?.value || "");
      formData.set("sector", document.getElementById("sector")?.value || "");
      formData.set("desc", document.getElementById("tunnel-desc")?.value || "");
      formData.set("cta", document.getElementById("cta-text")?.value || "");
      formData.set("payment", document.getElementById("payment-url")?.value || "");
      formData.set("mainColor", document.getElementById("mainColor")?.value || "");
      formData.set("backgroundColor", document.getElementById("backgroundColor")?.value || "");
      formData.set("userId", user.uid);
      formData.set("folder", folderName);
      formData.set("slug", slugFinal);
      formData.set("createdAt", new Date().toLocaleString("fr-FR"));

      const firestoreData = {
        userId: user.uid,
        name: formData.get("name"),
        goal: formData.get("goal"),
        sector: formData.get("sector"),
        desc: formData.get("desc"),
        cta: formData.get("cta"),
        payment: formData.get("payment"),
        type,
        slug: slugFinal,
        folder: folderName,
        mainColor: formData.get("mainColor"),
        backgroundColor: formData.get("backgroundColor"),
        createdAt: new Date().toISOString(),
        fields: formData.getAll("fields"),
        pageUrl: `https://cdn.sellyo.fr/${urlPrefix}/${folderName}/${slugFinal}.html`,
      };

      console.log("🧪 Données prêtes pour Firestore :", firestoreData);

      try {
        console.log("📤 Envoi à Make...");
        await fetch(webhookURL, {
          method: "POST",
          body: formData,
        });
        console.log("✅ Make a bien reçu.");

        console.log("📤 Envoi vers Firestore...");
        await addDoc(collection(db, "tunnels"), firestoreData);
        console.log("✅ Firestore success");

        alert("✅ Tunnel envoyé avec succès !");
        form.reset();
      } catch (err) {
        console.error("❌ Erreur Make ou Firestore :", err);
        alert("Erreur Make : " + err.message);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
