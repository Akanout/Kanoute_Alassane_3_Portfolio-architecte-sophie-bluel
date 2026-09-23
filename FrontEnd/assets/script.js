// Adresse de base de l'API. On la met dans une constante pour ne pas la reecrire partout.
// Si un jour l'adresse change, on ne modifie qu'ici.
const URL_API = "http://localhost:5678/api";


// Le dessin de la petite poubelle, ecrit en SVG.
// On le range dans une constante pour ne pas repeter ce long texte dans le code.
const ICONE_POUBELLE =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';


// On va chercher une seule fois tous les elements HTML dont on aura besoin.
// querySelector cherche par classe (le point) et getElementById cherche par id.
// Les ranger ici evite de refaire la recherche a chaque clic : c'est plus rapide et plus lisible.
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


// Image d'apercu affichee dans le formulaire. null = il n'y en a pas encore.
let apercu = null;


// Les donnees recuperees sur l'API. On les garde en memoire dans ces deux tableaux
// pour pouvoir filtrer sans redemander au serveur a chaque clic.
let travaux = [];
let categories = [];

// Affiche dans la galerie les projets contenus dans le tableau recu en parametre.
// On lui passe soit tous les projets, soit seulement ceux d'une categorie.
function afficherTravaux(liste) {
	// On vide la galerie avant de la remplir, sinon les projets s'ajouteraient
	// a la suite des anciens a chaque clic sur un filtre.
	galerie.innerHTML = "";

	// On repete le meme bloc pour chaque projet de la liste.
	for (const travail of liste) {
		const figure = document.createElement("figure");

		
		// L'image du projet : src = l'adresse de la photo, alt = le texte lu par les
		// lecteurs d'ecran et affiche si l'image ne charge pas.
		const image = document.createElement("img");
		image.src = travail.imageUrl;
		image.alt = travail.title;

		
		// La legende sous l'image, avec le titre du projet.
		const legende = document.createElement("figcaption");
		legende.innerText = travail.title;

		
		// On emboite les elements : l'image et la legende DANS la figure,
		// puis la figure DANS la galerie. C'est ce dernier appendChild qui
		// fait vraiment apparaitre le projet a l'ecran.
		figure.appendChild(image);
		figure.appendChild(legende);
		galerie.appendChild(figure);
	}
}

// Met en surbrillance le bouton de filtre sur lequel on vient de cliquer.
function activerBouton(boutonClique) {
	// On enleve d'abord la classe active de TOUS les boutons...
	const boutons = conteneurFiltres.querySelectorAll("button");
	for (const bouton of boutons) {
		bouton.classList.remove("active");
	}
	// ...puis on la remet uniquement sur celui qui a ete clique.
	// Comme ca il n'y a jamais deux boutons allumes en meme temps.
	boutonClique.classList.add("active");
}


// Fabrique un bouton de filtre et lui attache son comportement.
// nom = le texte affiche, idCategorie = le numero de la categorie
// (null pour le bouton "Tous").
function creerBoutonFiltre(nom, idCategorie) {
	const bouton = document.createElement("button");
	bouton.innerText = nom;

	// On branche l'ecouteur de clic tout de suite, a la creation du bouton.
	// Chaque bouton garde en memoire son propre idCategorie.
	bouton.addEventListener("click", function () {
		activerBouton(bouton);

		// Cas du bouton "Tous" : on reaffiche la liste complete et on sort.
		if (idCategorie === null) {
			afficherTravaux(travaux);
			return;
		}

		// filter garde seulement les projets dont la categorie correspond.
		// Il cree un nouveau tableau : le tableau travaux d'origine n'est pas modifie,
		// donc on peut cliquer sur les filtres autant de fois qu'on veut.
		const travauxFiltres = travaux.filter(function (travail) {
			return travail.categoryId === idCategorie;
		});
		afficherTravaux(travauxFiltres);
	});

	// On renvoie le bouton fini ; c'est afficherFiltres qui le placera dans la page.
	return bouton;
}


// Construit la barre de filtres a partir des categories recuperees sur l'API.
function afficherFiltres() {
	conteneurFiltres.innerHTML = "";

	// Le bouton "Tous" n'existe pas dans l'API : on l'ajoute a la main,
	// en premier, et il est actif au chargement de la page.
	const boutonTous = creerBoutonFiltre("Tous", null);
	boutonTous.classList.add("active");
	conteneurFiltres.appendChild(boutonTous);

	// Puis un bouton par categorie renvoyee par l'API.
	// Si l'architecte ajoute une categorie, le bouton apparait tout seul.
	for (const categorie of categories) {
		conteneurFiltres.appendChild(creerBoutonFiltre(categorie.name, categorie.id));
	}
}


// Va chercher les projets et les categories sur l'API, puis affiche la page.
// async veut dire que la fonction contient des attentes : elle peut mettre
// le code en pause avec await, sans bloquer le reste de la page.
async function chargerDonnees() {
	// try = on essaie. Si quelque chose echoue a l'interieur, on saute
	// directement dans le catch plus bas au lieu de planter.
	try {
		// fetch envoie la requete au serveur. await attend la reponse avant de continuer.
		const reponseTravaux = await fetch(URL_API + "/works");
		// Attention : fetch ne plante pas tout seul si le serveur repond une erreur
		// (404, 500...). Il faut verifier .ok soi-meme et lever l'erreur a la main.
		// throw arrete la fonction et envoie l'erreur au catch.
		if (!reponseTravaux.ok) {
			throw new Error("Travaux indisponibles");
		}
		travaux = await reponseTravaux.json();

		// Deuxieme appel : les categories, qui serviront aux filtres
		// et a la liste deroulante du formulaire d'ajout.
		const reponseCategories = await fetch(URL_API + "/categories");
		if (!reponseCategories.ok) {
			throw new Error("Categories indisponibles");
		}
		categories = await reponseCategories.json();

		// Les donnees sont la : on peut construire la galerie, les filtres
		// et la liste deroulante.
		afficherTravaux(travaux);
		afficherFiltres();
		remplirListeCategories();
	// catch = si ca a echoue. On affiche un message clair a l'utilisateur
	// plutot qu'une page vide sans explication.
	// console.error garde le detail technique pour le developpeur.
	} catch (erreur) {
		galerie.innerHTML =
			"<p class='message-erreur'>Les projets n'ont pas pu être chargés. Vérifiez que le serveur est lancé.</p>";
		console.error(erreur);
	}
}


// Recupere le token de connexion stocke dans le navigateur.
// Le token est la preuve que l'utilisateur s'est connecte : le serveur l'a
// fabrique apres avoir verifie l'email et le mot de passe.
// On utilise sessionStorage (et pas localStorage) : c'est volontaire, il se
// vide quand on ferme l'onglet, donc personne ne reste connecte sur le poste.
function recupererToken() {
	return sessionStorage.getItem("token");
}


// Repond vrai ou faux : y a-t-il un token ? Donc sommes-nous connectes ?
function estConnecte() {
	return recupererToken() !== null;
}


// Bascule la page en mode edition quand l'utilisateur est connecte.
function appliquerModeEdition() {
	// Si personne n'est connecte, on ne change rien : la page reste en mode visiteur.
	// C'est un "retour anticipe" : on sort tout de suite au lieu d'imbriquer un gros if.
	if (!estConnecte()) {
		return;
	}

	// On ne touche pas au style directement : on ajoute ou on enleve des classes,
	// et c'est le CSS qui decide de l'apparence. La classe "cache" masque un element.
	document.body.classList.add("connecte");
	document.getElementById("mode-edition").classList.remove("cache");
	document.getElementById("lien-modifier").classList.remove("cache");
	document.getElementById("lien-login").classList.add("cache");
	document.getElementById("lien-logout").classList.remove("cache");
	// La maquette ne montre pas les filtres en mode edition : on les masque.
	conteneurFiltres.classList.add("cache");
}


// Deconnexion : on supprime le token, puis on recharge la page d'accueil,
// qui repart donc en mode visiteur.
// preventDefault empeche le lien de suivre son href par defaut.
document.getElementById("lien-logout").addEventListener("click", function (evenement) {
	evenement.preventDefault();
	sessionStorage.removeItem("token");
	window.location.href = "./index.html";
});


// Ouvre la modale. On enleve la classe "cache" pour l'afficher et on passe
// aria-hidden a false pour que les lecteurs d'ecran la voient aussi.
// On revient toujours sur la vue galerie, et on la reconstruit pour etre
// sur d'afficher les projets a jour.
function ouvrirModale() {
	modale.classList.remove("cache");
	modale.setAttribute("aria-hidden", "false");
	afficherVueGalerie();
	afficherGalerieModale();
}


// Ferme la modale et remet le formulaire a zero, pour qu'a la prochaine
// ouverture il ne reste pas l'ancienne saisie.
function fermerModale() {
	modale.classList.add("cache");
	modale.setAttribute("aria-hidden", "true");
	reinitialiserFormulaire();
}


// La modale a deux vues dans le meme cadre. On n'en affiche qu'une a la fois.
// Vue 1 : la galerie des photos, avec les poubelles. Pas de fleche retour ici.
function afficherVueGalerie() {
	vueGalerie.classList.remove("cache");
	vueAjout.classList.add("cache");
	boutonRetour.classList.add("cache");
}


// Vue 2 : le formulaire d'ajout. La fleche retour apparait pour revenir en vue 1.
function afficherVueAjout() {
	vueGalerie.classList.add("cache");
	vueAjout.classList.remove("cache");
	boutonRetour.classList.remove("cache");
}


// Les quatre boutons de la modale : ouvrir, fermer (la croix), revenir en arriere,
// et passer au formulaire d'ajout.
document.getElementById("lien-modifier").addEventListener("click", ouvrirModale);
document.getElementById("modale-fermer").addEventListener("click", fermerModale);
document.getElementById("modale-retour").addEventListener("click", afficherVueGalerie);
document.getElementById("bouton-ajouter-photo").addEventListener("click", afficherVueAjout);


// Fermeture en cliquant sur le fond gris autour de la modale.
// evenement.target est l'element vraiment clique. On verifie qu'il s'agit bien
// du fond et pas d'un element a l'interieur, sinon le moindre clic dans la
// modale la fermerait.
modale.addEventListener("click", function (evenement) {
	if (evenement.target === modale) {
		fermerModale();
	}
});


// Fermeture avec la touche Echap, comme attendu pour une fenetre modale.
// On ne fait rien si la modale est deja fermee.
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
