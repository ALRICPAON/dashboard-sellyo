// ✅ FICHIER dashboard.js – Affiche le bloc formulaire au clic sur "Créer un tunnel"

const createBtn = document.getElementById("create-tunnel");
const formContainer = document.getElementById("create-tunnel-form");
const dashboardContent = document.getElementById("dashboard-content");

if (createBtn && formContainer && dashboardContent) {
  createBtn.addEventListener("click", () => {
    formContainer.style.display = "block";
    dashboardContent.innerHTML = "";
    console.log("✅ Formulaire principal affiché !");
  });
}
