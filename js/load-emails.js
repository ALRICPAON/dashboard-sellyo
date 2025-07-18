import { app } from "./firebase-init.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ✅ Assure que DOM est prêt
document.addEventListener("DOMContentLoaded", async () => {
  const db = getFirestore(app);
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (!id) {
    document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Aucun email trouvé.</p>";
    return;
  }

  const docRef = doc(db, "emails", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Email introuvable.</p>";
    return;
  }

  const data = docSnap.data();
  const emailURL = data.url;
  const fileName = data.name;

  if (!emailURL || !fileName) {
    document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Email incomplet (URL ou nom manquant).</p>";
    return;
  }

  try {
    const response = await fetch(emailURL + "?v=" + Date.now(), { cache: "no-store" });
    const htmlContent = await response.text();

    const editor = grapesjs.init({
      container: "#editor",
      fromElement: false,
      height: "100vh",
      width: "auto",
      storageManager: false,
      components: htmlContent,
    });

    const saveBtn = document.getElementById("save-email-btn");
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const updatedHTML = editor.getHtml();
        const webhookURL = "https://hook.eu2.make.com/57o9q241bdmobplyxrxn4o7iwopdmc59";

        const formData = new FormData();
        formData.append("id", id);
        formData.append("html", updatedHTML);
        formData.append("name", fileName);

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

        try {
          const res = await fetch(webhookURL, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            popup.innerHTML = `
              <div style="text-align:center;">
                ✅ Email modifié avec succès.<br><br>Redirection dans <strong>1min30</strong>...
              </div>`;
            setTimeout(() => {
              window.location.href = "emails.html";
            }, 90000);
          } else {
            throw new Error("Erreur lors de la sauvegarde");
          }
        } catch (err) {
          alert("❌ Échec de l'enregistrement : " + err.message);
        }
      });
    }
  } catch (e) {
    document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Erreur lors du chargement du contenu.</p>";
    console.error(e);
  }
});
