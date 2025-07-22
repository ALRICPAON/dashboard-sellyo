import { app } from "./firebase-init.js";
import {
  getFirestore, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore(app);

/**
 * Supprime un workflow et retire la carte du DOM
 */
export async function deleteWorkflow(id, button) {
  if (!confirm("❌ Supprimer ce workflow ?")) return;

  try {
    await deleteDoc(doc(db, "workflows", id));
    const card = button.closest(".workflow-item");
    if (card) card.remove();
  } catch (err) {
    console.error("Erreur suppression :", err);
    alert("❌ Impossible de supprimer le workflow.");
  }
}

/**
 * Redirige vers la page de modification du workflow
 */
export function editWorkflow(id) {
  window.location.href = `edit-workflow.html?id=${id}`;
}
