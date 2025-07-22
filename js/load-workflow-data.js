import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

let availableEmails = []; // Liste globale des emails pour injection dans les blocs

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Récupère les emails de l'utilisateur
  const qEmails = query(collection(db, "emails"), where("userId", "==", user.uid));
  const emailsSnap = await getDocs(qEmails);

  availableEmails = [];
  emailsSnap.forEach((doc) => {
    const data = doc.data();
    availableEmails.push({
      id: doc.id,
      name: data.name || "(Sans nom)"
    });
  });

  // Récupère les tunnels/landings
  const assocSelect = document.getElementById("associatedId");
  const qTunnels = query(collection(db, "tunnels"), where("userId", "==", user.uid));
  const tunnelsSnap = await getDocs(qTunnels);

  tunnelsSnap.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.name || "(Sans nom)";
    assocSelect.appendChild(option);
  });
});
