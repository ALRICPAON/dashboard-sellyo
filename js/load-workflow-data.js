import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Chargement des emails de l'utilisateur
  const emailSelects = document.querySelectorAll(".email-select");
  const qEmails = query(collection(db, "emails"), where("userId", "==", user.uid));
  const emailSnap = await getDocs(qEmails);

  emailSnap.forEach(doc => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.subject || "(Sans objet)";
    emailSelects.forEach(select => select.appendChild(option.cloneNode(true)));
  });

  // Chargement des tunnels/landings de l'utilisateur
  const select = document.getElementById("associatedId");
  const qTunnels = query(collection(db, "tunnels"), where("userId", "==", user.uid));
  const tunnelSnap = await getDocs(qTunnels);

  tunnelSnap.forEach(doc => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.name || "(Tunnel sans nom)";
    select.appendChild(option);
  });
});
