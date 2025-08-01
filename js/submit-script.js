import { app } from "./firebase-init.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const form = document.getElementById("script-form");
  if (!form) return;

  // Création du champ caché pour stocker la voix sélectionnée
  const formVoiceIdInput = document.createElement("input");
  formVoiceIdInput.type = "hidden";
  formVoiceIdInput.name = "voiceId";
  form.appendChild(formVoiceIdInput);

  // Gestion du changement sur videoType
  const videoTypeSelect = document.querySelector('[name="videoType"]');
  videoTypeSelect.addEventListener("change", async (e) => {
    if (e.target.value === "videoia") {  // adapte cette valeur selon ton formulaire
      await afficherPopupChoixVoix();
    } else {
      // Supprime la popup si existante
      const popup = document.getElementById("popupVoix");
      if (popup) popup.remove();
      formVoiceIdInput.value = "";  // reset voix sélectionnée
    }
  });

  // Fonction pour afficher la popup avec la liste des voix ElevenLabs
async function afficherPopupChoixVoix() {
  try {
    const response = await fetch('https://hook.eu2.make.com/enipb4pmk51w44hml32az6q8htnje6kt');
    const data = await response.json();
    const voices = data.voices || [];

    // 🔍 Détection langue et genre
    function detectLang(description) {
      const d = (description || "").toLowerCase();
      if (d.includes("french") || d.includes("français")) return "fr";
      if (d.includes("english") || d.includes("british") || d.includes("american")) return "en";
      return "other";
    }

    function detectGender(description) {
      const d = (description || "").toLowerCase();
      if (d.includes("female") || d.includes("femme") || d.includes("woman")) return "f";
      if (d.includes("male") || d.includes("homme") || d.includes("man")) return "m";
      return "u"; // unknown / unisex / neutre
    }

    voices.forEach(v => {
      v.lang = detectLang(v.description);
      v.gender = detectGender(v.description);
    });

    // 💡 Fonction de rendu avec double filtre
    function renderVoiceOptions(lang = "fr", gender = "all") {
      const container = document.getElementById("voixContainer");
      const filtered = voices.filter(v => {
        const matchLang = v.lang === lang;
        const matchGender = gender === "all" || (gender === "m" && v.gender === "m") || (gender === "f" && v.gender === "f");
        return matchLang && matchGender;
      });

      if (!filtered.length) {
        container.innerHTML = "<p>Aucune voix disponible pour cette sélection.</p>";
        return;
      }

      container.innerHTML = filtered.map(v => `
        <div style="margin-bottom: 1rem;">
          <input type="radio" name="selectedVoice" value="${v.voice_id}" id="voice-${v.voice_id}">
          <label for="voice-${v.voice_id}" style="font-weight: bold;">${v.name}</label>
          <p style="margin: 0.2rem 0;">${v.description || ""}</p>
          ${v.preview_url ? `<audio controls src="${v.preview_url}" style="width: 100%;"></audio>` : ""}
        </div>
      `).join("");
    }

    // 📦 HTML de la popup
    const popupHtml = `
      <div id="popupVoix" style="position:fixed;top:0;left:0;right:0;bottom:0;
        background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#222;padding:20px;border-radius:8px;width:500px;color:white;max-height:80vh;overflow-y:auto;">
          <h3>Choisissez votre voix IA</h3>

          <label for="langueVoix">Langue :</label>
          <select id="langueVoix" style="margin-bottom: 1rem;">
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="other">Autres</option>
          </select>

          <label for="genreVoix">Genre :</label>
          <select id="genreVoix" style="margin-bottom: 1rem;">
            <option value="all">Mixte</option>
            <option value="f">Femme</option>
            <option value="m">Homme</option>
          </select>

          <div id="voixContainer"></div>

          <div style="text-align:right;margin-top:1rem;">
            <button id="validerVoix" style="margin-right:10px;">Valider</button>
            <button id="fermerPopup">Fermer</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHtml);

    // 🎯 Rendu initial
    renderVoiceOptions("fr", "all");

    // 🔄 Réagir au changement de langue ou genre
    document.getElementById("langueVoix").onchange = () => {
      renderVoiceOptions(
        document.getElementById("langueVoix").value,
        document.getElementById("genreVoix").value
      );
    };
    document.getElementById("genreVoix").onchange = () => {
      renderVoiceOptions(
        document.getElementById("langueVoix").value,
        document.getElementById("genreVoix").value
      );
    };

    // ❌ Fermeture
    document.getElementById('fermerPopup').onclick = () => {
      document.getElementById('popupVoix').remove();
    };

    // ✅ Validation
    document.getElementById('validerVoix').onclick = () => {
      const selected = document.querySelector('input[name="selectedVoice"]:checked');
      if (selected) {
        formVoiceIdInput.value = selected.value;
        alert(`Voix sélectionnée : ${selected.value}`);
        document.getElementById('popupVoix').remove();
      } else {
        alert("Veuillez sélectionner une voix.");
      }
    };
  } catch (error) {
    console.error("Erreur chargement voix :", error);
    alert("Erreur lors du chargement des voix. Veuillez réessayer plus tard.");
  }
}
  // Soumission du formulaire
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Vous devez être connecté pour créer un script.");

    // 🔁 Récupération des données formulaire
    const slugInput = document.querySelector('[name="slug"]')?.value || "";
    const title = document.querySelector('[name="title"]')?.value || "";
    const description = document.querySelector('[name="description"]')?.value || "";
    const goal = document.querySelector('[name="goal"]')?.value || "";
    const audience = document.querySelector('[name="audience"]')?.value || "";
    const tone = document.querySelector('[name="tone"]')?.value || "";
    const language = document.querySelector('[name="language"]')?.value || "";
    const keywords = document.querySelector('[name="keywords"]')?.value || "";
    const videoType = document.querySelector('[name="videoType"]')?.value || "";
    const includeCaption = document.querySelector('[name="includeCaption"]')?.checked;
    const safeContent = document.querySelector('[name="safeContent"]')?.checked;
    const voiceId = document.querySelector('[name="voiceId"]')?.value || "";

    // 🧠 Slug propre + unique
    const slugClean = generateSlug(slugInput || title);
    const slugFinal = `${slugClean}-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdAt = new Date().toISOString();

    // ⏳ Loader pendant la génération
    const popup = document.createElement("div");
    popup.id = "script-loading-overlay";
    popup.innerHTML = `
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);
        color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;
        z-index:9999;padding:2rem;text-align:center;font-size:1.2rem;">
        <div class="loader" style="border: 5px solid #444; border-top: 5px solid #0af;
          border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;
          margin-bottom: 2rem;"></div>
        <p>🎬 <strong>Création de votre script...</strong></p>
        <p>Merci de patienter jusqu’à <strong>1min30</strong>.<br>Ne fermez pas cette page.</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(popup);

    try {
      // 📤 Appel Webhook Make
      const res = await fetch("https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          type: "script",
          slug: slugFinal,
          title,
          description,
          goal,
          audience,
          tone,
          language,
          keywords,
          videoType,
          includeCaption,
          safeContent,
          voiceId // Ajout de la voix sélectionnée
        })
      });

      if (!res.ok) throw new Error("Erreur webhook Make");

      console.log("📡 Script envoyé à Make avec succès");

  

// Génère un ID manuellement
const docId = slugFinal; // ou autre valeur unique que tu veux forcer

const userRef = doc(db, "scripts", user.uid, "items", docId);
await setDoc(userRef, {
  userId: user.uid,
  title,
  slug: slugFinal,
  description,
  tone,
  language,
  goal,
  audience,
  keywords,
  videoType,
  includeCaption,
  safeContent,
  voiceId,
  createdAt,
  url: `https://alricpaon.github.io/sellyo-hosting/script/${slugFinal}.html`,
  videoUrl: `https://alricpaon.github.io/sellyo-hosting/videos/${slugFinal}.mp4`,
  status: "pending",
  source: "manuel",
  captionUrl: `https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${slugFinal}-caption.txt`,
  youtubeTitleUrl: `https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${slugFinal}-title.txt`,
  promptVideoUrl: videoType === "videoia"
    ? `https://raw.githubusercontent.com/ALRICPAON/sellyo-hosting/main/script/${slugFinal}-prompt.txt`
    : null
});

      // ✅ Redirection après délai
      setTimeout(() => {
        window.location.href = "scripts.html";
      }, 90000); // 1min30

    } catch (err) {
      console.error("❌ Erreur de soumission :", err);
      alert("Erreur : " + err.message);
    } finally {
      document.getElementById("script-loading-overlay")?.remove();
    }
  });

  // 🔤 Nettoyage du slug
  function generateSlug(text) {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});
