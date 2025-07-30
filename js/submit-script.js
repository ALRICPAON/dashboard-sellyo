document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("script-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      goal: formData.get("goal"),
      audience: formData.get("audience"),
      tone: formData.get("tone"),
      language: formData.get("language"),
      keywords: formData.get("keywords"),
      videoType: formData.get("videoType"),
      includeCaption: formData.get("includeCaption") === "on",
      safeContent: formData.get("safeContent") === "on",
    };

   // Ajout ID utilisateur via Firebase Auth
try {
  const user = await firebase.auth().currentUser;
  if (!user) throw new Error("Utilisateur non authentifié");
  data.userId = user.uid;

  // ✅ Type de contenu (utile pour Make + GitHub)
  data.type = "script";
} catch (err) {
  console.error("Erreur d'authentification :", err);
  alert("Vous devez être connecté pour créer un script.");
  return;
}

    try {
      const response = await fetch("https://hook.eu2.make.com/tepvi5cc9ieje6cp9bmcaq7u6irs58dp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi au webhook Make");
      }

      alert("✅ Script en cours de génération. Il apparaîtra bientôt dans votre interface.");
      form.reset();
    } catch (error) {
      console.error("Erreur submit-script:", error);
      alert("Erreur lors de la soumission du formulaire. Veuillez réessayer.");
    }
  });
});
