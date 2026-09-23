// Adresse de base de l'API, comme dans script.js.
const URL_API = "http://localhost:5678/api";


// On recupere le formulaire, les deux champs et la zone ou afficher une erreur.
const formulaire = document.getElementById("formulaire-login");
const champEmail = document.getElementById("email");
const champMotDePasse = document.getElementById("password");
const zoneErreur = document.getElementById("erreur-login");


// Envoi du formulaire de connexion.
// preventDefault empeche le navigateur de recharger la page tout seul :
// c'est nous qui gerons l'envoi en JavaScript.
formulaire.addEventListener("submit", async function (evenement) {
	evenement.preventDefault();
	zoneErreur.innerText = "";

	// trim() enleve les espaces avant et apres l'email, une faute de frappe courante.
	// On ne touche pas au mot de passe : un espace peut en faire partie.
	const email = champEmail.value.trim();
	const motDePasse = champMotDePasse.value;

	// Premiere verification cote navigateur : inutile d'appeler le serveur
	// si un champ est vide.
	if (email === "" || motDePasse === "") {
		zoneErreur.innerText = "Merci de remplir les deux champs.";
		return;
	}

	try {
		// Ici on envoie du texte, pas de fichier : on precise donc bien
		// Content-Type application/json, et JSON.stringify transforme l'objet
		// JavaScript en texte JSON que le serveur sait lire.
		// Les noms email et password sont imposes par l'API.
		const reponse = await fetch(URL_API + "/users/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: email, password: motDePasse })
		});

		// Le meme message pour un email inconnu (404) et un mot de passe faux (401).
		// C'est volontaire : on ne veut pas indiquer a un inconnu que l'email existe.
		// Le mot de passe n'est jamais compare ici : le serveur le verifie de son cote,
		// en le comparant a une version chiffree (bcrypt).
		if (!reponse.ok) {
			zoneErreur.innerText = "Erreur dans l’identifiant ou le mot de passe.";
			return;
		}

		const donnees = await reponse.json();

		// Connexion reussie : le serveur renvoie un token, valable 24 h.
		// On le garde dans sessionStorage, qui se vide a la fermeture de l'onglet,
		// puis on renvoie l'utilisateur sur l'accueil, qui passera en mode edition.
		sessionStorage.setItem("token", donnees.token);
		sessionStorage.setItem("userId", donnees.userId);

		window.location.href = "./index.html";
	// On arrive ici si le serveur ne repond pas du tout (backend non lance).
	// Le message le dit clairement, au lieu de laisser la page sans reaction.
	} catch (erreur) {
		zoneErreur.innerText = "Serveur injoignable. Vérifiez qu'il est bien lancé.";
		console.error(erreur);
	}
});
