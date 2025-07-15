// ✅ tunnel-submit.js – version finale avec emails dynamiques et champs complets

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";
  let slugCounter = Math.floor(10000 + Math.random() * 90000);

  const typeField = document.getElementById("tunnel-type");
  const dynamicFieldsContainer = document.getElementById("form-content-fields");
  const folderInput = document.getElementById("folderName");
  const slugInput = document.getElementById("slug");
  const emailBlock = document.getElementById("form-email-fields");
  const linkedContent = document.getElementById("linked-content");

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
      const selected = typeField.value.trim().toLowerCase();
      dynamicFieldsContainer.innerHTML = "";

      if (["landing", "landing page", "video"].includes(selected)) {
        dynamicFieldsContainer.innerHTML = `
          <label>Nom du contenu *</label><br>
          <input type="text" id="tunnel-name" required><br><br>
          <label>Objectif *</label><br>
          <input type="text" id="tunnel-goal"><br><br>
          <label>Secteur</label><br>
          <input type="text" id="sector"><br><br>
          <label>Description de l’offre *</label><br>
          <textarea id="tunnel-desc" required></textarea><br><br>
          <label>Prix (optionnel)</label><br>
          <input type="text" id="price"><br><br>
          <label>URL de paiement</label><br>
          <input type="url" id="payment"><br><br>
          <label>Logo (URL ou fichier)</label><br>
          <input type="file" id="logo" accept="image/*"><br><br>
          <label>Image principale (URL ou fichier)</label><br>
          <input type="file" id="cover-image" accept="image/*"><br><br>
          <label>Vidéo (URL ou fichier)</label><br>
          <input type="file" id="custom-video" accept="video/*"><br><br>
        `;
      }

      if (selected === "email") {
        if (emailBlock) emailBlock.style.display = "block";
      } else {
        if (emailBlock) emailBlock.style.display = "none";
      }
    });
    typeField.dispatchEvent(new Event("change"));
  }

  onAuthStateChanged(auth, async (user) => {
    if (user && linkedContent) {
      const q = query(collection(db, "tunnels"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (["landing", "tunnel"].includes(data.type)) {
          const opt = document.createElement("option");
          opt.value = data.slug;
          opt.textContent = `${data.type === "tunnel" ? "Tunnel" : "Landing"} : ${data.name}`;
          linkedContent.appendChild(opt);
        }
      });
    }
  });

  const observer = new MutationObserver(() => {
    const form = document.getElementById("tunnel-form");
    if (!form) return;
    observer.disconnect();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return alert("Vous devez être connecté.");

      const popup = document.createElement("div");
      popup.id = "tunnel-loading-overlay";
      popup.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;"><p>⏳ Génération en cours…</p></div>`;
      document.body.appendChild(popup);

      const type = typeField?.value || "tunnel";
      const name = document.getElementById("tunnel-name")?.value || "";
      const goal = document.getElementById("tunnel-goal")?.value || "";
      const sector = document.getElementById("sector")?.value || "";
      const desc = document.getElementById("tunnel-desc")?.value || "";
      const cta = document.getElementById("cta-text")?.value || "";
      const mainColor = document.getElementById("mainColor")?.value || "";
      const backgroundColor = document.getElementById("backgroundColor")?.value || "";
      const price = document.getElementById("price")?.value || "";
      const payment = document.getElementById("payment")?.value || "";
      const folder = folderInput?.value || "";
      const slug = slugInput?.value || "";
      const slugFinal = `${slug}-${slugCounter}`;
      const createdAt = new Date().toISOString();

      const linked = document.getElementById("linked-content")?.value || "";
      const manualList = document.getElementById("manual-client-list")?.value || "";
      const emailType = document.getElementById("email-type")?.value || "";
      const sendMode = document.getElementById("email-send-mode")?.value || "";
      const sendDate = document.getElementById("email-schedule-date")?.value || "";
      const sendHour = document.getElementById("email-schedule-hour")?.value || "";

      const firestoreData = {
        userId: user.uid,
        type,
        name,
        goal,
        sector,
        desc,
        cta,
        mainColor,
        backgroundColor,
        price,
        payment,
        folder,
        slug: slugFinal,
        createdAt,
        pageUrl: `https://cdn.sellyo.fr/${type}/${folder}/${slugFinal}.html`,
        linkedContent: linked,
        manualClientList: manualList,
        emailType,
        sendMode,
        sendDate,
        sendHour
      };

      const formData = new FormData();
      Object.entries(firestoreData).forEach(([key, val]) => formData.append(key, val));

      try {
        await fetch(webhookURL, { method: "POST", body: formData });
        await addDoc(collection(db, "tunnels"), firestoreData);
        window.location.href = "tunnels.html";
      } catch (err) {
        alert("Erreur : " + err.message);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
