import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Récupère l'ID depuis l'URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
let fileName = "";

if (!id) {
  document.body.innerHTML = `<div class="message">❌ Aucune ID de script fournie.</div>`;
  throw new Error("ID manquant");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const scriptRef = doc(db, "scripts", user.uid, "items", id);
    const docSnap = await getDoc(scriptRef);

    if (!docSnap.exists()) {
      document.body.innerHTML = `<div class="message">❌ Script introuvable.</div>`;
      return;
    }

    const data = docSnap.data();
    fileName = data.name || "script-sans-nom";
    const url = data.url;

    const res = await fetch(url);
    const html = await res.text();

    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      height: "100vh",
      width: "auto",
      storageManager: false,
      plugins: [],
    });

    editor.setComponents(html);

    const saveBtn = document.getElementById("save-script-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        try {
          const updatedHTML = editor.getHtml();

          const firebaseFunctionURL = "https://us-central1-sellyo-3bbdb.cloudfunctions.net/modifyScript";

          const res = await fetch(firebaseFunctionURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scriptId: id,
              userId: user.uid,
              updates: {
                html: updatedHTML,
                name: fileName,
                type: "script"
              }
            }),
          });

          const resText = await res.text();
          console.log("🔍 Réponse de modifyScript:", res.status, resText);

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

          if (res.ok) {
            popup.innerHTML = `
              ✅ Script modifié avec succès.<br><br>Redirection dans <strong>1min30</strong>...`;
            setTimeout(() => {
              window.location.href = "scripts.html";
            }, 90000);
          } else {
            throw new Error("Erreur serveur : " + resText);
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
