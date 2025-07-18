import { app } from "./firebase-init.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(app);
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

if (!id) {
  document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Aucun email trouvé.</p>";
  throw new Error("Pas d'ID dans l'URL");
}

const docRef = doc(db, "emails", id);
const docSnap = await getDoc(docRef);

if (!docSnap.exists()) {
  document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Email introuvable.</p>";
  throw new Error("Document Firebase non trouvé");
}

const data = docSnap.data();
const emailURL = data.url;

if (!emailURL) {
  document.body.innerHTML = "<p style='color: white; padding: 2rem;'>Aucune URL d'email trouvée dans les données.</p>";
  throw new Error("Pas d'URL");
}

// Charger le HTML du mail depuis GitHub
const response = await fetch(emailURL);
const htmlContent = await response.text();

// Initialiser GrapesJS avec ce contenu
const editor = grapesjs.init({
  container: "#editor",
  fromElement: false,
  height: "100vh",
  width: "auto",
  storageManager: false,
  components: htmlContent,
});
