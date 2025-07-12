// ✅ tunnel-submit.js – version FormData (fichiers + Firestore)

import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
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

      const type = document.getElementById("tunnel-type")?.value || "tunnel";
      const name = document.getElementById("tunnel-name")?.value || "";
      const goal = document.getElementById("tunnel-goal")?.value || "";
      const sector = document.getElementById("sector")?.value || "";
      const desc = document.getElementById("tunnel-desc")?.value || "";
      const cta = document.getElementById("cta-text")?.value || "";
      const mainColor = document.getElementById("mainColor")?.value || "";
      const backgroundColor = document.getElementById("backgroundColor")?.value || "";
      const folder = folderInput?.value || "";
      const slug = slugInput?.value || "";
      const slugFinal = `${slug}-${slugCounter}`;
      const createdAt = new Date().toISOString();

      // Construction du FirestoreData
      const firestoreData = {
        userId: user.uid,
        name,
        goal,
        sector,
        desc,
        cta,
        type,
        folder,
        slug: slugFinal,
        mainColor,
        backgroundColor,
        createdAt,
        pageUrl: `https://cdn.sellyo.fr/${["landing", "email", "video"].includes(type) ? type : "tunnel"}/${folder}/${slugFinal}.html`,
        fields: Array.from(document.querySelectorAll("input[name='fields']:checked")).map((el) => ({
          label: el.value.charAt(0).toUpperCase() + el.value.slice(1),
          name: el.value,
          type: el.value === "email" ? "email" : "text",
          placeholder: `Votre ${el.value}`
        }))
      };

      // Envoi vers Make avec fichiers
      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", name);
      formData.append("goal", goal);
      formData.append("sector", sector);
      formData.append("desc", desc);
      formData.append("cta", cta);
      formData.append("mainColor", mainColor);
      formData.append("backgroundColor", backgroundColor);
      formData.append("userId", user.uid);
      formData.append("folder", folder);
      formData.append("slug", slugFinal);
      formData.append("createdAt", createdAt);
      formData.append("fields", JSON.stringify(firestoreData.fields));

      const logo = document.getElementById("logo")?.files[0];
      const cover = document.getElementById("cover-image")?.files[0];
      const video = document.getElementById("custom-video")?.files[0];

      if (logo) formData.append("logo", logo);
      if (cover) formData.append("cover", cover);
      if (video) formData.append("video", video);

      try {
        await fetch(webhookURL, {
          method: "POST",
          body: formData
        });

        await addDoc(collection(db, "tunnels"), firestoreData);
        alert("✅ Tunnel généré avec succès !");
        form.reset();
      } catch (err) {
        console.error("❌ Erreur Make ou Firestore :", err);
        alert("Erreur lors de l'envoi : " + err.message);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
