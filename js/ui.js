import { app } from "./firebase-init.js";
import {
  getAuth,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth(app);

// 👁️ Afficher/Masquer le mot de passe
window.togglePassword = function(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "🙈";
  } else {
    input.type = "password";
    icon.textContent = "👁️";
  }
};

// 🔐 Lien de réinitialisation du mot de passe
window.resetPassword = async function() {
  const email = prompt("Entre ton adresse email pour recevoir un lien de réinitialisation :");
  if (!email) return;

  try {
    await sendPasswordResetEmail(auth, email);
    alert("📧 Email de réinitialisation envoyé !");
  } catch (error) {
    alert("❌ Erreur : " + error.message);
    console.error(error);
  }
};
