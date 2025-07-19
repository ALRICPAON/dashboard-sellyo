import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
let fileName = "";

if (!id) {
  document.body.innerHTML = `<div class="message">❌ Aucune ID de landing fournie.</div>`;
  throw new Error("ID manquant");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const docRef = doc(db, "tunnels", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      document.body.innerHTML = `<div class="message">❌ Landing introuvable.</div>`;
      return;
    }

    const data = docSnap.data();
    fileName = data.name || "landing-sans-nom";
    const url = data.pageUrl;

    // 🔄 Récupère le HTML de GitHub
    const res = await fetch(url);
    const html = await res.text();

    // ✅ Initialise GrapesJS
    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      height: "100vh",
      width: "auto",
      storageManager: false,
      plugins: [],
    });

    editor.setComponents(html);

    // ✅ Sauvegarde
    const saveBtn = document.getElementById("save-landing-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const updatedHTML = editor.getHtml();

        try {
          const webhookURL = "https://hook.eu2.make.com/57o9q241bdmobplyxrxn4o7iwopdmc59";
          const formData = new FormData();
          formData.append("id", id);
          formData.append("html", updatedHTML);
          formData.append("name", fileName);
          formData.append("type", "landing");

          // ✅ Popup visuelle
          const popup = document.createElement("div");
          popup.id = "popup-message";
          popup.innerHTML = `
            <div style="text-align:center;">
              ⏳ Sauvegarde en cours...<br><br>Merci de patienter <strong>1min30</strong> avant redirection.
            </div>`;
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
            body: formData,
          });

          if (res.ok) {
            popup.innerHTML = `✅ Landing modifiée avec succès.<br><br>Redirection dans <strong>1min30</strong>...`;
            setTimeout(() => {
              window.location.href = "landings.html";
            }, 90000);
          } else {
            throw new Error("Erreur Make : " + res.statusText);
          }
        } catch (err) {
          alert("❌ Erreur de sauvegarde : " + err.message);
        }
      });
    }

  } catch (err) {
    document.body.innerHTML = `<div class="message">❌ Erreur : ${err.message}</div>`;
  }
});
