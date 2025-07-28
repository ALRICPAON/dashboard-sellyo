import { app } from "/js/firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

const emailId = new URLSearchParams(window.location.search).get("id");
const dropdown = document.getElementById("link-content");
const feedback = document.getElementById("feedback");
const saveBtn = document.getElementById("save-manual");

let allLeads = [];

onAuthStateChanged(auth, async (user) => {
  if (!user || !emailId) {
    window.location.href = "index.html";
    return;
  }

  // 🔄 Charger tous les leads de l'utilisateur
  const leadsQuery = query(collection(db, "leads"), where("userId", "==", user.uid));
  const leadsSnap = await getDocs(leadsQuery);
  leadsSnap.forEach(doc => {
    const lead = doc.data();
    lead.id = doc.id;
    allLeads.push(lead);
  });

  // 🔄 Charger les tunnels ou landings
  const tunnelsQuery = query(collection(db, "tunnels"), where("userId", "==", user.uid));
  const tunnelsSnap = await getDocs(tunnelsQuery);
  tunnelsSnap.forEach(doc => {
    const data = doc.data();
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.innerText = `${data.name} (${data.type || "tunnel"})`;
    opt.dataset.slug = data.slug || doc.id; // ⚠️ On récupère bien le slug ici
    dropdown.appendChild(opt);
  });

  // ✅ Enregistrer les destinataires associés
  saveBtn.addEventListener("click", async () => {
    const selected = dropdown.options[dropdown.selectedIndex];
    const selectedSlug = selected?.dataset.slug || dropdown.value;

    if (!selectedSlug) {
      feedback.innerText = "❌ Aucune landing sélectionnée.";
      return;
    }

    // 🎯 Filtrer les leads par slug ou source.refId
    const matchingLeads = allLeads.filter(lead =>
      lead.slug === selectedSlug || lead.source?.refId === selectedSlug
    );

    const allRecipients = [...new Set(matchingLeads.map(l => l.email))];

    if (allRecipients.length === 0) {
      feedback.innerText = "❌ Aucun lead associé trouvé.";
      return;
    }

    try {
      const ref = doc(db, "emails", emailId);
      await updateDoc(ref, {
        recipients: allRecipients,
        source: {
          type: "linkedContent",
          refId: selectedSlug
        }
      });
      feedback.innerText = `✅ ${allRecipients.length} destinataire(s) associé(s) à "${selected.innerText}"`;
    } catch (err) {
      feedback.innerText = "❌ Erreur : " + err.message;
    }
  });
});
