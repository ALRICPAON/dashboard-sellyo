
function switchLang(lang) {
  fetch(`lang/${lang}.json`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("headline").textContent = data.headline;
      document.getElementById("createAccountBtn").textContent = data.createAccount;
      document.getElementById("loginBtn").textContent = data.login;
    });
}
