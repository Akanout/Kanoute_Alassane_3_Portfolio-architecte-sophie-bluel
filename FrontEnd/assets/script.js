const URL_API = "http://localhost:5678/api";

const ICONE_POUBELLE =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

const galerie = document.querySelector(".gallery");
const conteneurFiltres = document.querySelector(".filters");
const modale = document.getElementById("modale");
const modaleGalerie = document.getElementById("modale-galerie");
const vueGalerie = document.getElementById("vue-galerie");
const vueAjout = document.getElementById("vue-ajout");
const boutonRetour = document.getElementById("modale-retour");
const formulaireAjout = document.getElementById("formulaire-ajout");
const champImage = document.getElementById("image");
const champTitre = document.getElementById("titre");
const champCategorie = document.getElementById("categorie");
const boutonValider = document.getElementById("bouton-valider");
const zoneImage = document.getElementById("zone-image");
const zoneImageVide = document.getElementById("zone-image-vide");
const erreurAjout = document.getElementById("erreur-ajout");

let apercu = null;

let travaux = [];
let categories = [];

function afficherTravaux(liste) {
	galerie.innerHTML = "";

	for (const travail of liste) {
		const figure = document.createElement("figure");

		const image = document.createElement("img");
		image.src = travail.imageUrl;
		image.alt = travail.title;

		const legende = document.createElement("figcaption");
		legende.innerText = travail.title;

		figure.appendChild(image);
		figure.appendChild(legende);
		galerie.appendChild(figure);
	}
}

function activerBouton(boutonClique) {
	const boutons = conteneurFiltres.querySelectorAll("button");
	for (const bouton of boutons) {
		bouton.classList.remove("active");
	}
	boutonClique.classList.add("active");
}

function creerBoutonFiltre(nom, idCategorie) {
	const bouton = document.createElement("button");
	bouton.innerText = nom;

	bouton.addEventListener("click", function () {
		activerBouton(bouton);

		if (idCategorie === null) {
			afficherTravaux(travaux);
			return;
		}

		const travauxFiltres = travaux.filter(function (travail) {
			return travail.categoryId === idCategorie;
		});
		afficherTravaux(travauxFiltres);
	});

	return bouton;
}

function afficherFiltres() {
	conteneurFiltres.innerHTML = "";

	const boutonTous = creerBoutonFiltre("Tous", null);
	boutonTous.classList.add("active");
	conteneurFiltres.appendChild(boutonTous);

	for (const categorie of categories) {
		conteneurFiltres.appendChild(creerBoutonFiltre(categorie.name, categorie.id));
	}
}

async function chargerDonnees() {
	try {
		const reponseTravaux = await fetch(URL_API + "/works");
		if (!reponseTravaux.ok) {
			throw new Error("Travaux indisponibles");
		}
		travaux = await reponseTravaux.json();

		const reponseCategories = await fetch(URL_API + "/categories");
		if (!reponseCategories.ok) {
			throw new Error("Categories indisponibles");
		}
		categories = await reponseCategories.json();

		afficherTravaux(travaux);
		afficherFiltres();
		remplirListeCategories();
	} catch (erreur) {
		galerie.innerHTML =
			"<p class='message-erreur'>Les projets n'ont pas pu être chargés. Vérifiez que le serveur est lancé.</p>";
		console.error(erreur);
	}
}

function recupererToken() {
	return sessionStorage.getItem("token");
}

function estConnecte() {
	return recupererToken() !== null;
}

function appliquerModeEdition() {
	if (!estConnecte()) {
		return;
	}

	document.body.classList.add("connecte");
	document.getElementById("mode-edition").classList.remove("cache");
	document.getElementById("lien-modifier").classList.remove("cache");
	document.getElementById("lien-login").classList.add("cache");
	document.getElementById("lien-logout").classList.remove("cache");
	conteneurFiltres.classList.add("cache");
}

document.getElementById("lien-logout").addEventListener("click", function (evenement) {
	evenement.preventDefault();
	sessionStorage.removeItem("token");
	window.location.href = "./index.html";
});

function ouvrirModale() {
	modale.classList.remove("cache");
	modale.setAttribute("aria-hidden", "false");
	afficherVueGalerie();
	afficherGalerieModale();
}

function fermerModale() {
	modale.classList.add("cache");
	modale.setAttribute("aria-hidden", "true");
	reinitialiserFormulaire();
}

function afficherVueGalerie() {
	vueGalerie.classList.remove("cache");
	vueAjout.classList.add("cache");
	boutonRetour.classList.add("cache");
}

function afficherVueAjout() {
	vueGalerie.classList.add("cache");
	vueAjout.classList.remove("cache");
	boutonRetour.classList.remove("cache");
}

document.getElementById("lien-modifier").addEventListener("click", ouvrirModale);
document.getElementById("modale-fermer").addEventListener("click", fermerModale);
document.getElementById("modale-retour").addEventListener("click", afficherVueGalerie);
document.getElementById("bouton-ajouter-photo").addEventListener("click", afficherVueAjout);

modale.addEventListener("click", function (evenement) {
	if (evenement.target === modale) {
		fermerModale();
	}
});

document.addEventListener("keydown", function (evenement) {
	if (evenement.key === "Escape" && !modale.classList.contains("cache")) {
		fermerModale();
	}
});

function afficherGalerieModale() {
	modaleGalerie.innerHTML = "";

	for (const travail of travaux) {
		const figure = document.createElement("figure");

		const image = document.createElement("img");
		image.src = travail.imageUrl;
		image.alt = travail.title;

		const boutonSupprimer = document.createElement("button");
		boutonSupprimer.classList.add("bouton-supprimer");
		boutonSupprimer.setAttribute("aria-label", "Supprimer " + travail.title);
		boutonSupprimer.innerHTML = ICONE_POUBELLE;
		boutonSupprimer.addEventListener("click", function () {
			supprimerTravail(travail.id);
		});

		figure.appendChild(image);
		figure.appendChild(boutonSupprimer);
		modaleGalerie.appendChild(figure);
	}
}

async function supprimerTravail(identifiant) {
	try {
		const reponse = await fetch(URL_API + "/works/" + identifiant, {
			method: "DELETE",
			headers: {
				Authorization: "Bearer " + recupererToken()
			}
		});

		if (!reponse.ok) {
			throw new Error("Suppression refusée (" + reponse.status + ")");
		}

		travaux = travaux.filter(function (travail) {
			return travail.id !== identifiant;
		});
		afficherTravaux(travaux);
		afficherGalerieModale();
	} catch (erreur) {
		erreurAjout.innerText = "La suppression a échoué. Reconnectez-vous et réessayez.";
		console.error(erreur);
	}
}

function remplirListeCategories() {
	champCategorie.innerHTML = "";

	const optionVide = document.createElement("option");
	optionVide.value = "";
	champCategorie.appendChild(optionVide);

	for (const categorie of categories) {
		const option = document.createElement("option");
		option.value = categorie.id;
		option.innerText = categorie.name;
		champCategorie.appendChild(option);
	}
}

function verifierFormulaire() {
	const imageChoisie = champImage.files.length > 0;
	const titreRempli = champTitre.value.trim() !== "";
	const categorieChoisie = champCategorie.value !== "";

	boutonValider.disabled = !(imageChoisie && titreRempli && categorieChoisie);
}

champImage.addEventListener("change", function () {
	erreurAjout.innerText = "";
	const fichier = champImage.files[0];

	if (!fichier) {
		verifierFormulaire();
		return;
	}

	if (fichier.size > 4 * 1024 * 1024) {
		erreurAjout.innerText = "L'image est trop lourde (4 Mo maximum).";
		champImage.value = "";
		verifierFormulaire();
		return;
	}

	supprimerApercu();
	apercu = document.createElement("img");
	apercu.classList.add("apercu");
	apercu.src = URL.createObjectURL(fichier);
	apercu.alt = "Aperçu de la photo à envoyer";
	zoneImage.appendChild(apercu);

	zoneImageVide.classList.add("cache");
	verifierFormulaire();
});

function supprimerApercu() {
	if (apercu !== null) {
		apercu.remove();
		apercu = null;
	}
}

champTitre.addEventListener("input", verifierFormulaire);
champCategorie.addEventListener("change", verifierFormulaire);

function reinitialiserFormulaire() {
	formulaireAjout.reset();
	supprimerApercu();
	zoneImageVide.classList.remove("cache");
	erreurAjout.innerText = "";
	boutonValider.disabled = true;
}

formulaireAjout.addEventListener("submit", async function (evenement) {
	evenement.preventDefault();
	erreurAjout.innerText = "";

	const donnees = new FormData();
	donnees.append("image", champImage.files[0]);
	donnees.append("title", champTitre.value.trim());
	donnees.append("category", champCategorie.value);

	try {
		const reponse = await fetch(URL_API + "/works", {
			method: "POST",
			headers: {
				Authorization: "Bearer " + recupererToken()
			},
			body: donnees
		});

		if (!reponse.ok) {
			throw new Error("Ajout refusé (" + reponse.status + ")");
		}

		const nouveauTravail = await reponse.json();
		travaux.push(nouveauTravail);

		afficherTravaux(travaux);
		afficherGalerieModale();
		fermerModale();
	} catch (erreur) {
		erreurAjout.innerText = "L'envoi a échoué. Vérifiez les champs et réessayez.";
		console.error(erreur);
	}
});

appliquerModeEdition();
chargerDonnees();
