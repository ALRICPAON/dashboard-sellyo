// ✅ load-profile.js – Charge les infos de l'utilisateur connecté

import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const nameSpan = document.getElementById("user-name");
  const emailSpan = document.getElementById("user-email");

  nameSpan.textContent = user.displayName || "Nom non fourni";
  emailSpan.textContent = user.email;

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => {
      window.location.href = "index.html";
    });
  });
});
