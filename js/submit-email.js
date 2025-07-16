import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp"; // Ton webhook Make

  const form = document.getElementById("email-form");
  if (!form) return;

  // 📌 Auto-remplissage de la date selon le type d'envoi
  const emailTypeField = document.getElementById("email-type");
  const sendAtField = document.getElementById("send-at");

  emailTypeField.addEventListener("change", function () {
    const delayMap = {
      "relance1": 2,
      "relance2": 5,
      "relance3": 7
    };

    const selected = this.value;

    if (delayMap[selected]) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // UTC correction
      now.setDate(now.getDate() + delayMap[selected]);

      const formatted = now.toISOString().slice(0, 16); // Format pour input type="datetime-local"
      sendAtField.value = formatted;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    // Affichage popup de chargement
    const popup = document.createElement("div");
    popup.id = "email-loading-overlay";
    popup.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;"><p>⏳ Génération de votre email…</p></div>`;
    document.body.appendChild(popup);

    // Récupération des paramètres Firestore
    let senderEmail = "";
    let senderName = "";
    try {
      const settingsDoc = await getDoc(doc(db, "settings", user.uid));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        senderEmail = data.senderEmail || "";
        senderName = data.senderName || "";
      }
    } catch (err) {
      console.warn("Erreur Firestore (settings) :", err.message);
    }

    // Lecture des champs du formulaire
    const folder = document.getElementById("folderName")?.value || "";
    const slug = document.getElementById("slug")?.value || "";
    const subject = document.getElementById("email-subject")?.value || "";
    const desc = document.getElementById("email-desc")?.value || "";
    const productLink = document.getElementById("product-link")?.value || "";
    const productPrice = document.getElementById("product-price")?.value || "";
    const file = document.getElementById("attached-file")?.files[0];
    const emailType = document.getElementById("email-type")?.value || "";
    const sendAtRaw = document.getElementById("send-at")?.value || "";
    const linkedTunnelId = document.getElementById("linked-tunnel-id")?.value || "";

    // ✅ Transformation en timestamp (secondes)
    const sendAtDate = new Date(sendAtRaw);
    const sendAtTimestamp = Math.floor(sendAtDate.getTime() / 1000);

    const createdAt = new Date().toISOString();
    const slugFinal = `${slug}-${Math.floor(10000 + Math.random() * 90000)}`;

    const firestoreData = {
      userId: user.uid,
      type: "email",
      folder,
      slug: slugFinal,
      subject,
      desc,
      productLink,
      productPrice,
      emailType,
      sendAt: sendAtTimestamp,
      linkedTunnelId,
      createdAt,
      senderEmail,
      senderName,
      pageUrl: `https://cdn.sellyo.fr/emails/${folder}/${slugFinal}.html`
    };

    // Envoi à Make via FormData
    const formData = new FormData();
    Object.entries(firestoreData).forEach(([key, val]) => formData.append(key, val));
    if (file) formData.append("file", file);

    try {
      await fetch(webhookURL, { method: "POST", body: formData });
      await addDoc(collection(db, "emails"), firestoreData);
      window.location.href = "tunnels.html";
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
