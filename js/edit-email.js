import { app } from "./firebase-init.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(app);
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

if (!id) {
  document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Aucun email trouvé.</p>";
  throw new Error("Pas d'ID dans l'URL");
}

const docRef = doc(db, "emails", id);
const docSnap = await getDoc(docRef);

if (!docSnap.exists()) {
  document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Email introuvable.</p>";
  throw new Error("Document Firebase non trouvé");
}

const data = docSnap.data();
const emailURL = data.url;
const fileName = data.name; // ✅ nouveau : le nom du fichier HTML

if (!emailURL || !fileName) {
  document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Email incomplet : URL ou nom manquant.</p>";
  throw new Error("Pas d'URL ou nom");
}

// Charger le HTML depuis GitHub
const response = await fetch(emailURL + '?v=' + Date.now(), {
  cache: 'no-store'
});
const htmlContent = await response.text();

// Initialiser l'éditeur GrapesJS
const editor = grapesjs.init({
  container: "#editor",
  fromElement: false,
  height: "100vh",
  width: "auto",
  storageManager: false,
  components: htmlContent,
});

// Gestion du bouton "Enregistrer"
const saveBtn = document.getElementById("save-email-btn");

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const updatedHTML = editor.getHtml();

    try {
      const webhookURL = "https://hook.eu2.make.com/57o9q241bdmobplyxrxn4o7iwopdmc59";
      const formData = new FormData();
      formData.append("id", id);
      formData.append("html", updatedHTML);
      formData.append("name", fileName); // ✅ important

      // ✅ Affiche une popup visuelle
      const popup = document.createElement("div");
      popup.innerHTML = "⏳ Sauvegarde en cours... Veuillez patienter 20 secondes.";
      popup.style.cssText = `
        position: fixed;
        top: 30%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #222;
        color: white;
        padding: 2rem;
        border-radius: 10px;
        font-size: 1.2rem;
        z-index: 9999;
        text-align: center;
      `;
      document.body.appendChild(popup);

      const res = await fetch(webhookURL, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        setTimeout(() => {
          window.location.href = "emails.html";
        }, 20000);
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }
    } catch (err) {
      alert("❌ Échec de l'enregistrement : " + err.message);
    }
  });
}
