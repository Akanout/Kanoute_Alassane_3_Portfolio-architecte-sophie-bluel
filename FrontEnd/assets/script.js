const galerie = document.querySelector(".gallery");
console.log(galerie);
galerie.innerHTML = "";
async function chargerTravaux() {
  const reponse = await fetch("http://localhost:5678/api/works");
  const travaux = await reponse.json();
  console.log(travaux);
 for (const travail of travaux) {
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

chargerTravaux();