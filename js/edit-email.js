// ✅ edit-email.js – Chargement de l'éditeur GrapesJS avec le contenu HTML existant

import { app } from "./firebase-init.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);
const editorContainer = document.getElementById("editor");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return (editorContainer.innerHTML = "ID d'email introuvable.");

  const docRef = doc(db, "emails", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return (editorContainer.innerHTML = "Email introuvable.");

  const emailData = snap.data();
  const emailURL = emailData.url;

  if (!emailURL) return (editorContainer.innerHTML = "Aucun contenu HTML à charger.");

  // Récupère le HTML du mail depuis GitHub
  const html = await fetch(emailURL).then(res => res.text());

  // Initialise GrapesJS
  const editor = grapesjs.init({
    container: '#editor',
    fromElement: false,
    height: '100vh',
    width: '100%',
    storageManager: false,
    plugins: [],
    pluginsOpts: {},
    components: html,
    style: ''
  });
});
