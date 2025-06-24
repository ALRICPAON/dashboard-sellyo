// ✅ FICHIER dashboard.js – Affiche uniquement le conteneur du formulaire

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("🪩 Conteneur du formulaire affiché (le choix de type se fait ensuite)");
  });
}
