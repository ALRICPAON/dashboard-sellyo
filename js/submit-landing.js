// ✅ submit-landing.js – Script dédié au formulaire Landing Page

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const webhookURL = "https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp";
  const slugCounter = Math.floor(10000 + Math.random() * 90000);

  const form = document.getElementById("tunnel-form");
  const folderInput = document.getElementById("folderName");
  const slugInput = document.getElementById("slug");

  if (!form) return;

  folderInput.addEventListener("input", () => {
    folderInput.value = folderInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });

  slugInput.addEventListener("input", () => {
    slugInput.value = slugInput.value.replace(/[^a-zA-Z0-9\-]/g, "");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté.");

    const popup = document.createElement("div");
    popup.id = "tunnel-loading-overlay";
    popup.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);color:white;display:flex;align-items:center;justify-content:center;z-index:9999;"><p>⏳ Création de votre landing page…</p></div>`;
    document.body.appendChild(popup);

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
    const customField = document.getElementById("customField")?.value || "";
const extraText = document.getElementById("extraText")?.value || "";


    const fields = Array.from(document.querySelectorAll("input[name='fields']:checked")).map((el) => ({
      label: el.value.charAt(0).toUpperCase() + el.value.slice(1),
      name: el.value,
      type: el.value === "email" ? "email" : "text",
      placeholder: `Votre ${el.value}`
    }));

    const firestoreData = {
  userId: user.uid,
  type: "landing",
  name,
  goal,
  sector,
  desc,
  cta,
  mainColor,
  backgroundColor,
  folder,
  slug: slugFinal,
      htmlFileName: `${slugFinal}.html`,
  createdAt,
  pageUrl: `https://cdn.sellyo.fr/landing/${folder}/${slugFinal}.html`,   
  fields,
  customField,
  extraText
};

    const formData = new FormData();
    Object.entries(firestoreData).forEach(([key, val]) => formData.append(key, typeof val === "object" ? JSON.stringify(val) : val));

    const logo = document.getElementById("logo")?.files[0];
    const cover = document.getElementById("cover-image")?.files[0];
    const video = document.getElementById("custom-video")?.files[0];
    if (logo) formData.append("logo", logo);
    if (cover) formData.append("cover", cover);
    if (video) formData.append("video", video);

    try {
      await fetch(webhookURL, { method: "POST", body: formData });
      await addDoc(collection(db, "tunnels"), firestoreData);
      window.location.href = "dashboard.html?tunnel=1";
    } catch (err) {
      alert("Erreur : " + err.message);
    }
  });
});
