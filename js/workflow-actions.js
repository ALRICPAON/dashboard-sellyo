<script>
  async function deleteWorkflow(id, button) {
    if (!confirm("❌ Supprimer ce workflow ?")) return;
    button.disabled = true;
    try {
      const db = firebase.firestore(); // ou utilise `getFirestore(app)` selon ton setup
      await firebase.firestore().collection("workflows").doc(id).delete();
      button.parentElement.parentElement.remove();
    } catch (err) {
      console.error("Erreur suppression :", err);
      alert("❌ Impossible de supprimer.");
    }
  }

  function editWorkflow(id) {
    window.location.href = `edit-workflow.html?id=${id}`;
  }
</script>
