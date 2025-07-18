// ✅ edit-email.js – Gère l'édition d'un email existant

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById("edit-email-form");
const params = new URLSearchParams(window.location.search);
const emailId = params.get("id");

if (!emailId) {
  alert("Aucun ID fourni pour l'email.");
  window.location.href = "emails.html";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Chargement des données existantes
  const docRef = doc(db, "emails", emailId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    alert("Email introuvable.");
    window.location.href = "emails.html";
    return;
  }

  const data = docSnap.data();
  form.name.value = data.name || "";
  form.subject.value = data.subject || "";
  form.desc.value = data.desc || "";
  form.productLink.value = data.productLink || "";
  form.price.value = data.price || "";
  form.type.value = data.type || "relance";

  // Soumission du formulaire
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    await updateDoc(docRef, {
      name: form.name.value.trim(),
      subject: form.subject.value.trim(),
      desc: form.desc.value.trim(),
      productLink: form.productLink.value.trim(),
      price: form.price.value.trim(),
      type: form.type.value.trim(),
    });

    alert("Email mis à jour avec succès.");
    window.location.href = "emails.html";
  });
});
