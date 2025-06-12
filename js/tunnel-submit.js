// tunnel-submit.js

document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("create-tunnel");
  const formContainer = document.getElementById("create-tunnel-form");
  const dashboardContent = document.getElementById("dashboard-content");

  if (createBtn && formContainer && dashboardContent) {
    createBtn.addEventListener("click", () => {
      formContainer.style.display = "block";
      dashboardContent.innerHTML = "";
    });
  } else {
    console.warn("Un des éléments n'a pas été trouvé dans le DOM");
  }

  const tunnelForm = document.getElementById("tunnel-form");

  if (tunnelForm) {
    tunnelForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("tunnel-name").value;
      const goal = document.getElementById("tunnel-goal").value;
      const content = document.getElementById("tunnel-content").value;
      const domain = document.getElementById("custom-domain").value;
      const image = document.getElementById("tunnel-image").files[0];
      const video = document.getElementById("tunnel-video").files[0];

      const user = firebase.auth().currentUser;
      if (!user) return alert("Utilisateur non connecté");

      const uid = user.uid;

      const data = {
        name,
        goal,
        content,
        domain,
        uid,
        timestamp: new Date(),
      };

      const db = firebase.firestore();
      const ref = await db.collection("tunnels").add(data);

      const storage = firebase.storage();
      const uploads = [];

      if (image) {
        const imgRef = storage.ref(`tunnels/${ref.id}/image.jpg`);
        uploads.push(imgRef.put(image));
      }

      if (video) {
        const vidRef = storage.ref(`tunnels/${ref.id}/video.mp4`);
        uploads.push(vidRef.put(video));
      }

      await Promise.all(uploads);

      alert("Tunnel enregistré avec succès !");
      tunnelForm.reset();
      formContainer.style.display = "none";
    });
  }
});
