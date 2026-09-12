const galerie = document.querySelector(".gallery");
let travaux = [];

function afficherTravaux(liste) {
  galerie.innerHTML = "";
  for (const travail of liste) {
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = travail.imageUrl;
    image.alt = travail.title;
    figure.appendChild(image);
    const legende = document.createElement("figcaption");
    legende.innerText = travail.title;
    figure.appendChild(legende);
    galerie.appendChild(figure);
  }
}

async function chargerTravaux() {
  const reponse = await fetch("http://localhost:5678/api/works");
  travaux = await reponse.json();
  afficherTravaux(travaux);
}

async function chargerCategories() {
  const reponse = await fetch("http://localhost:5678/api/categories");
  const categories = await reponse.json();

  const filtres = document.querySelector(".filters");

   const boutonTous = document.createElement("button");
  boutonTous.innerText = "Tous";
  boutonTous.addEventListener("click", function () {
    afficherTravaux(travaux);
  });
  filtres.appendChild(boutonTous);

  for (const categorie of categories) {
    const bouton = document.createElement("button");
    bouton.innerText = categorie.name;
    bouton.addEventListener("click", function () {
      const travauxFiltres = [];
      for (const travail of travaux) {
        if (travail.categoryId === categorie.id) {
          travauxFiltres.push(travail);
        }
      }
      afficherTravaux(travauxFiltres);
    });
    filtres.appendChild(bouton);
  }
}

chargerTravaux();
chargerCategories();