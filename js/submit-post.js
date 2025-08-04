import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const videoSelect = document.getElementById("video");
const form = document.getElementById("post-form");
const statusDiv = document.getElementById("status");

const WEBHOOK_URL = "https://hook.eu2.make.com/8fkv2651hengftj6qqh258h3c8yhb5yh";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const q = collection(db, "scripts", user.uid, "items");
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const slug = data.slug || docSnap.id;
    const option = document.createElement("option");
    option.value = slug;
    option.textContent = `${data.title || "Vidéo"} – ${slug}`;
    videoSelect.appendChild(option);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const slug = videoSelect.value;
    const scheduledAt = document.getElementById("scheduledAt").value;
    const platforms = Array.from(
      document.querySelectorAll("input[name='platforms']:checked")
    ).map((el) => el.value);

    if (!slug || !scheduledAt || platforms.length === 0) {
      statusDiv.textContent = "❌ Merci de remplir tous les champs.";
      return;
    }

    try {
      const videoRef = doc(db, "scripts", user.uid, "items", slug);
      const metaVoiceRef = doc(videoRef, "meta", "voice");

      const videoSnap = await getDoc(videoRef);
      const voiceSnap = await getDoc(metaVoiceRef);

      const videoData = videoSnap.data() || {};
      const voiceData = voiceSnap.exists() ? voiceSnap.data() : {};

      const payload = {
        userId: user.uid,
        slug,
        videoUrl: videoData.videoUrl,
        captionUrl: videoData.captionUrl,
        youtubeTitleUrl: videoData.youtubeTitleUrl,
        voiceUrl: voiceData.voiceUrl || null,
        scheduledAt,
        platforms,
      };

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        statusDiv.textContent = "✅ Publication planifiée avec succès !";
        form.reset();
      } else {
        statusDiv.textContent = "❌ Erreur lors de l’envoi à Make.";
      }
    } catch (err) {
      console.error("Erreur:", err);
      statusDiv.textContent = "❌ Erreur interne. Voir la console.";
    }
  });
});

