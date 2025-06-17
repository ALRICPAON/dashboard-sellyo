import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2yzKA3kESPjgcFk6pojJQK4rNToywqJI",
  authDomain: "sellyo-3bbdb.firebaseapp.com",
  projectId: "sellyo-3bbdb",
  storageBucket: "sellyo-3bbdb.appspot.com",
  messagingSenderId: "465249279278",
  appId: "1:465249279278:web:319844f7477ab47930eebf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔍 Récupérer le slug depuis l’URL (?from=slug)
const params = new URLSearchParams(window.location.search);
const slug = params.get("from");

if (slug) {
  // 🔎 Rechercher dans Firestore le tunnel avec ce nom
  const tunnelsRef = collection(db, "tunnels");
  const q = query(tunnelsRef, where("name", "==", slug.replaceAll("-", " ")));

  getDocs(q).then(snapshot => {
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();

      // 🔁 Afficher les données dynamiques
      document.getElementById("thank-title").textContent = `Merci pour votre inscription à "${data.name}" !`;

      if (data.logoUrl) {
        document.getElementById("logo").src = data.logoUrl;
      }
      if (data.mainColor) {
        document.querySelector("h1").style.color = data.mainColor;
      }
    } else {
      document.getElementById("thank-title").textContent = "Merci pour votre inscription !";
    }
  }).catch(err => {
    console.error("Erreur Firestore :", err);
  });
}
