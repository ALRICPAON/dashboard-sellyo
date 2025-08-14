import { app } from "./firebase-init.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ⚠️ Mets ici l'URL EXACTE de ton webhook Make (branche tunnel)
const MAKE_WEBHOOK_TUNNEL_URL = "https://hook.eu2.make.com/XXXXX"; // ← remplace

const form = document.getElementById("tunnel-form");
if (!form) throw new Error("Form #tunnel-form introuvable.");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Non autorisé");
    window.location.href = "index.html";
    return;
  }
});

function slugify(s) {
  return (s || "")
    .toString()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .substring(0, 80);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const name = e.target.name.value.trim();
  const desc = e.target.desc.value.trim();
  const redirectURL = e.target.redirectURL.value.trim() || null;
  const mainColor = e.target.mainColor.value.trim() || "#00ccff";
  const logoUrl = e.target.logoUrl.value.trim() || null;
  const coverUrl = e.target.coverUrl.value.trim() || null;
  const pages = Math.min(8, Math.max(1, parseInt(e.target.pages.value || "5", 10)));

  const slug = slugify(name) || `tunnel-${Date.now()}`;

  // Base de publication GitHub (à ajuster si besoin)
  // Exemple: https://alricpaon.github.io/sellyo-hosting/tunnels/{uid}/{slug}/page1.html
  const basePath = `tunnels/${user.uid}/${slug}/`;
  const baseUrl = `https://alricpaon.github.io/sellyo-hosting/${basePath}`;
  const firstPageUrl = `${baseUrl}page1.html`;

  // 1) Créer le doc Firestore pour lister dans tunnels.html
  //    (collection plate = compatible avec ton load-tunnels.js actuel)
  let docRef;
  try {
    docRef = await addDoc(collection(db, "tunnels"), {
      userId: user.uid,
      name,
      goal: desc || null,           // compat : ton listage affiche data.goal
      url: firstPageUrl,            // utilisé par le bouton "Voir"
      type: "tunnel",
      slug,
      basePath,
      pages,
      mainColor,
      logoUrl,
      coverUrl,
      redirectURL,
      status: "generating",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Firestore addDoc error", err);
    alert("❌ Erreur lors de l’enregistrement Firestore.");
    return;
  }

  // 2) Appeler Make (clés EXACTES utilisées dans tes prompts Make)
  const payload = {
    userId: user.uid,
    name,
    desc,
    redirectURL,
    coverUrl,
    mainColor,
    logoUrl,
    pages,                 // pour l'iterator (1..pages)
    slug,
    basePath,              // pour pousser sur GitHub à l’emplacement attendu
    baseUrl,               // utile si tu veux logguer/retourner l’URL
    tunnelDocId: docRef.id // optionnel: pour callback/maj status
  };

  try {
    await fetch(MAKE_WEBHOOK_TUNNEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    alert("✅ Tunnel en cours de génération. Tu seras redirigé vers la liste.");
    window.location.href = "tunnels.html";
  } catch (err) {
    console.error("Make webhook error", err);
    alert("❌ Erreur d’envoi au scénario Make.");
  }
});
