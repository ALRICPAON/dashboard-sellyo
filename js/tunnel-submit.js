import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { uploadCoverImage, uploadCustomVideo } from './upload-media.js';

const auth = getAuth();
const db = getFirestore();

document.getElementById("lang-switch")?.addEventListener("change", (e) => {
  const lang = e.target.value;
  alert("Langue changée en : " + lang);
});

document.getElementById("create-tunnel").addEventListener("click", () => {
  document.getElementById("create-tunnel-form").style.display = "block";
  document.getElementById("dashboard-content").innerHTML = "";
});

document.getElementById("use-custom-domain").addEventListener("change", function () {
  const customField = document.getElementById("custom-domain-field");
  customField.style.display = this.checked ? "block" : "none";
});

document.getElementById("tunnel-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return alert("Utilisateur non connecté");

  const name = document.getElementById("tunnel-name").value;
  const goal = document.getElementById("tunnel-goal").value;
  const type = document.getElementById("tunnel-type").value;
  const sector = document.getElementById("sector").value;
  const desc = document.getElementById("tunnel-desc").value;
  const cta = document.getElementById("cta-text").value;
  const payment = document.getElementById("payment-url").value;
  const wantsCustomDomain = document.getElementById("use-custom-domain").checked;
  const customDomain = wantsCustomDomain ? document.getElementById("custom-domain").value : null;

  const file = document.getElementById("cover-image").files[0];
  let coverUrl = null;

  if (file) {
    try {
      coverUrl = await uploadCoverImage(file, name.toLowerCase().replaceAll(" ", "_"));
    } catch (err) {
      console.error("Erreur upload image", err);
    }
  }

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
      createdAt: new Date()
    });

    alert("Tunnel enregistré avec succès !");
    document.getElementById("tunnel-form").reset();
    document.getElementById("custom-domain-field").style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Erreur lors de la sauvegarde du tunnel.");
  }
});
