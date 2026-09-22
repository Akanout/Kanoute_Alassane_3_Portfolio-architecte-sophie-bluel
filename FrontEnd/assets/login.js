const URL_API = "http://localhost:5678/api";

const formulaire = document.getElementById("formulaire-login");
const champEmail = document.getElementById("email");
const champMotDePasse = document.getElementById("password");
const zoneErreur = document.getElementById("erreur-login");

formulaire.addEventListener("submit", async function (evenement) {
	evenement.preventDefault();
	zoneErreur.innerText = "";

	const email = champEmail.value.trim();
	const motDePasse = champMotDePasse.value;

	if (email === "" || motDePasse === "") {
		zoneErreur.innerText = "Merci de remplir les deux champs.";
		return;
	}

	try {
		const reponse = await fetch(URL_API + "/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email, password: motDePasse })
		});

		if (!reponse.ok) {
			zoneErreur.innerText = "Erreur dans l’identifiant ou le mot de passe.";
			return;
		}

		const donnees = await reponse.json();

		sessionStorage.setItem("token", donnees.token);
		sessionStorage.setItem("userId", donnees.userId);

		window.location.href = "./index.html";
	} catch (erreur) {
		zoneErreur.innerText = "Serveur injoignable. Vérifiez qu'il est bien lancé.";
		console.error(erreur);
	}
});
