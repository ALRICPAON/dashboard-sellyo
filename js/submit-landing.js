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

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Vous devez être connecté.");
      return;
    }

    // Ici, tu peux envoyer dans Firestore sans souci
    console.log("✅ Utilisateur connecté :", user.uid);

    const firestoreData = {
      userId: user.uid,
      type: "landing",
      name: document.getElementById("tunnel-name")?.value || "",
      goal: document.getElementById("tunnel-goal")?.value || "",
      sector: document.getElementById("sector")?.value || "",
      desc: document.getElementById("tunnel-desc")?.value || "",
      cta: document.getElementById("cta-text")?.value || "",
      mainColor: document.getElementById("mainColor")?.value || "",
      backgroundColor: document.getElementById("backgroundColor")?.value || "",
      folder: folderInput?.value || "",
      slug: `${slugInput?.value || ""}-${slugCounter}`,
      htmlFileName: `${slugInput?.value || ""}-${slugCounter}.html`,
      pageUrl: `https://cdn.sellyo.fr/landing/${folderInput?.value || ""}/${slugInput?.value || ""}-${slugCounter}.html`,
      createdAt: new Date().toISOString(),
      fields: Array.from(document.querySelectorAll("input[name='fields']:checked")).map((el) => ({
        label: el.value.charAt(0).toUpperCase() + el.value.slice(1),
        name: el.value,
        type: el.value === "email" ? "email" : "text",
        placeholder: `Votre ${el.value}`
      })),
      customField: document.getElementById("customField")?.value || "",
      extraText: document.getElementById("extraText")?.value || ""
    };

    console.log("📤 Données envoyées à Firestore :", firestoreData);

    try {
      const ref = await addDoc(collection(db, "tunnels"), firestoreData);
      console.log("✅ Document créé avec ID :", ref.id);
      // Appel webhook + redirection
    } catch (err) {
      console.error("❌ Erreur Firestore :", err);
      alert("Erreur lors de la création : " + err.message);
    }
  });
});
