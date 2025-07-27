import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
let fileName = "";

if (!id) {
  document.body.innerHTML = `<div class="message">❌ Aucune ID fournie.</div>`;
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
   const folder = data.folder || "default";
const htmlFileName = data.htmlFileName || "default.html";
const url = `https://alricpaon.github.io/sellyo-hosting/landing/${folder}/${htmlFileName}`;
    fileName = data.name || "landing-sans-nom";

    // 🔁 Charge le HTML depuis GitHub
    const res = await fetch(url);
    const html = await res.text();

    // ✅ GrapesJS
    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      height: "100vh",
      width: "auto",
      storageManager: false,
      plugins: [],
    });

    editor.setComponents(html);

   const saveBtn = document.getElementById("save-landing-btn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const updatedHTML = editor.getHtml();

    const popup = document.createElement("div");
    popup.id = "popup-message";
    popup.innerHTML = `<div style="text-align:center;">⏳ Sauvegarde en cours...<br><br>Merci de patienter <strong>1min30</strong>.</div>`;
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
      text-align: center;`;
    document.body.appendChild(popup);

    try {
      const firebaseFunctionURL = "https://us-central1-sellyo-3bbdb.cloudfunctions.net/modifyEmail";

      const res = await fetch(firebaseFunctionURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: id,
          updates: {
            html: updatedHTML,
            name: fileName,
            type: "landing",
            folder,
            htmlFileName
          }
        }),
      });

      const resText = await res.text();
      console.log("🔍 Réponse de modifyEmail:", res.status, resText);

      if (res.ok) {
        popup.innerHTML = `✅ Landing modifiée.<br><br>Redirection dans <strong>1min30</strong>...`;
        setTimeout(() => {
          window.location.href = "landing.html";
        }, 90000);
      } else {
        throw new Error("Erreur serveur : " + resText);
      }
    } catch (err) {
      alert("❌ Erreur de sauvegarde : " + err.message);
    }
  });
}
}); // fin de onAuthStateChanged
