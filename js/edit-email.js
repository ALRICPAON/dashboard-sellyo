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
        body: formData
      });

      if (res.ok) {
        // ✅ Met à jour le contenu de la popup
        popup.innerHTML = `
          <div style="text-align:center;">
            ✅ Email modifié avec succès.<br><br>Redirection dans <strong>1min30</strong>...
          </div>`;

        // ✅ Redirection différée
        setTimeout(() => {
          window.location.href = "emails.html";
        }, 90000); // 1min30
      } else {
        throw new Error("Erreur lors de la sauvegarde");
      }

    } catch (err) {
      alert("❌ Échec de l'enregistrement : " + err.message);
    }
  });
}
