import { app } from "./firebase-init.js";
import { getFirestore, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(app);

// ✅ Supprimer un workflow
export async function deleteWorkflow(id, button) {
  if (!confirm("❌ Supprimer ce workflow ?")) return;

  button.disabled = true;

  try {
    await deleteDoc(doc(db, "workflows", id));
    button.closest(".workflow-item").remove(); // retire la carte du DOM
  } catch (err) {
    console.error("Erreur suppression workflow :", err);
    alert("Erreur lors de la suppression.");
    button.disabled = false;
  }
}

// ✅ Modifier (rediriger vers page édition)
export function editWorkflow(id) {
  window.location.href = `edit-workflow.html?id=${id}`;
}
