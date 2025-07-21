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

  // 🔁 Récupération des emails
  const emailSelect = document.getElementById("emailSelect");
  const qEmails = query(collection(db, "emails"), where("userId", "==", user.uid));
  const emailsSnap = await getDocs(qEmails);

  emailsSnap.forEach((doc) => {
    const data = doc.data();
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = data.name || "(Sans nom)";
    emailSelect.appendChild(option);
  });

  // 🔁 Récupération des landings et tunnels
  const assocSelect = document.getElementById("associatedIdSelect");
  const tunnelsRef = collection(db, "tunnels");
  const tunnelsSnap = await getDocs(tunnelsRef);

  tunnelsSnap.forEach((doc) => {
    const data = doc.data();
    if (data.userId === user.uid) {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = data.name || "(Sans nom)";
      assocSelect.appendChild(option);
    }
  });
});
