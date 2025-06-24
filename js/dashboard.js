// ✅ FICHIER dashboard.js – Gère l'affichage du formulaire depuis le bouton "Créer un tunnel"

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const form = document.getElementById("tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && form && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    form.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("🪩 Formulaire affiché depuis dashboard.js");
  });
}
