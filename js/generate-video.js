document.getElementById("videoType").addEventListener("change", function () {
  const type = this.value;
  document.getElementById("facecam-options").style.display = type === "facecam" ? "block" : "none";
  document.getElementById("avatar-options").style.display = type === "avatar" ? "block" : "none";
  document.getElementById("aigen-options").style.display = type === "aigen" ? "block" : "none";
});

document.getElementById("generateVideoBtn").addEventListener("click", async () => {
  const type = document.getElementById("videoType").value;
  const status = document.getElementById("generationStatus");
  status.innerText = "⏳ Traitement en cours...";

  if (type === "facecam") {
    const file = document.getElementById("facecamFile").files[0];
    // 🔄 Appel vers Firebase Function pour upload + nettoyer
    await handleFacecamUpload(file);
  } else if (type === "avatar") {
    const voice = document.getElementById("avatarVoice").value;
    const avatarId = document.getElementById("avatarId").value;
    // 🔄 Appel vers Firebase Function `generateAvatarVideo`
    await generateAvatar(voice, avatarId);
  } else if (type === "aigen") {
    // 🔄 Appel Runway Gen-2 via Firebase
    await generateAICompleteVideo();
  } else {
    status.innerText = "⚠️ Veuillez sélectionner un type de vidéo.";
  }

  status.innerText = "✅ Vidéo en cours de génération. Vous recevrez un lien sous peu.";
});
