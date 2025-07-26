import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// Récupère l'ID depuis l'URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
let fileName = "";

if (!id) {
  document.body.innerHTML = `<div class="message">❌ Aucune ID d'email fournie.</div>`;
  throw new Error("ID manquant");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const docRef = doc(db, "emails", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      document.body.innerHTML = `<div class="message">❌ Email introuvable.</div>`;
      return;
    }

    const data = docSnap.data();
    fileName = data.name || "email-sans-nom";
    const url = data.url;

    // Récupère le contenu HTML brut depuis GitHub
    const res = await fetch(url);
    const html = await res.text();

    // Initialise GrapesJS
    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      height: "100vh",
      width: "auto",
      storageManager: false,
      plugins: [],
    });

    editor.setComponents(html); // Injecte le contenu HTML dans GrapesJS

    // Sauvegarde
    const saveBtn = document.getElementById("save-email-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        try {
          const updatedHTML = editor.getHtml();

          const firebaseFunctionURL = "https://us-central1-sellyo-3bbdb.cloudfunctions.net/modifyEmail";

          const res = await fetch(firebaseFunctionURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: id,
              html: updatedHTML,
              name: fileName,
              type: "email"
            }),
          });
          const resText = await res.text(); // 🔥 lis la réponse brute (même en cas d'erreur)
console.log("🔍 Réponse de modifyEmail:", res.status, resText);


          // Popup visuelle
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
  console.log("✅ Fonction exécutée avec succès !");
            popup.innerHTML = `
              ✅ Email modifié avec succès.<br><br>Redirection dans <strong>1min30</strong>...`;
            setTimeout(() => {
              window.location.href = "emails.html";
            }, 90000); // 1min30
         } else {
  throw new Error("Erreur serveur : " + resText); // 🔁 utilise resText au lieu de res.statusText
}
          }
        } catch (err) {
          alert("❌ Erreur de sauvegarde : " + err.message);
        }
      });
    }

    // ENVOI du mail (mise à jour statut Firestore)
    const sendBtn = document.getElementById("send-email-btn");
    if (sendBtn) {
      sendBtn.addEventListener("click", async () => {
        try {
          await updateDoc(doc(db, "emails", id), {
            status: "ready",
            source: { type: "manuel" } // On réassigne proprement à chaque update manuel
          });

          alert("📨 Le mail est maintenant prêt à être envoyé.");
        } catch (err) {
          alert("❌ Erreur lors de l'envoi : " + err.message);
        }
      });
    }

  } catch (err) {
    document.body.innerHTML = `<div class="message">❌ Erreur : ${err.message}</div>`;
  }
});
