import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2yzKA3kESPjgcFk6pojJQK4rNToywqJI",
  authDomain: "sellyo-3bbdb.firebaseapp.com",
  projectId: "sellyo-3bbdb",
  storageBucket: "sellyo-3bbdb.firebasestorage.app",
  messagingSenderId: "465249279278",
  appId: "1:465249279278:web:319844f7477ab47930eebf",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 🔐 Check si utilisateur connecté
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userEmail").textContent = "Connecté en tant que : " + user.email;
  } else {
    window.location.href = "login.html";
  }
});

// 🔓 Déconnexion
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});
