import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo } from './upload-media.js';

const auth = getAuth();
const db = getFirestore();

// Bouton "Créer un tunnel"
document.getElementById("create-tunnel").addEventListener("click", (e) => {
  e.preventDefault(); // Empêche le rechargement de page
  document.getElementById("create-tunnel-form").style.display = "block";
  document.getElementById("dashboard-content").innerHTML = "";
});

// Checkbox domaine personnalisé
document.getElementById("use-custom-domain").addEventListener("change", function () {
  const customField = document.getElementById("custom-domain-field");
  customField.style.display = this.checked ? "block" : "none";
});

// Soumission du formulaire
document.getElementById("tunnel-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("🛑 Utilisateur non connecté");

  // Récupère les champs
  const name = document.getElementById("tunnel-name").value;
  const goal = document.getElementById("tunnel-goal").value;
  const type = document.getElementById("tunnel-type").value;
  const sector = document.getElementById("sector").value;
  const desc = document.getElementById("tunnel-desc").value;
  const cta = document.getElementById("cta-text").value;
  const payment = document.getElementById("payment-url").value;
  const wantsCustomDomain = document.getElementById("use-custom-domain").checked;
  const customDomain = wantsCustomDomain ? document.getElementById("custom-domain").value : null;

  const tunnelSlug = name.toLowerCase().replaceAll(" ", "-");

  // Upload image
  const file = document.getElementById("cover-image").files[0];
  let coverUrl = null;

  if (file) {
    try {
      coverUrl = await uploadCoverImage(file, tunnelSlug);
    } catch (err) {
      console.error("❌ Erreur upload image :", err);
    }
  }

  // Upload vidéo
  const videoFile = document.getElementById("custom-video").files[0];
  let videoUrl = null;

  if (videoFile) {
    try {
      videoUrl = await uploadCustomVideo(videoFile, tunnelSlug);
    } catch (err) {
      console.error("❌ Erreur upload vidéo :", err);
    }
  }

  // Enregistrement Firestore
  try {
    await addDoc(collection(db, "tunnels"), {
      userId: user.uid,
      name,
      goal,
      type,
      sector,
      desc,
      cta,
      payment,
      customDomain,
      coverUrl,
      videoUrl,
      createdAt: new Date()
    });

    alert("✅ Tunnel enregistré avec succès !");
    document.getElementById("tunnel-form").reset();
    document.getElementById("custom-domain-field").style.display = "none";
  } catch (err) {
    console.error(err);
    alert("❌ Erreur lors de la sauvegarde du tunnel.");
  }
});
