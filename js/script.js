const cards = [
	{
		title: "cardGenderRevealTitle",
		p: "cardGenderRevealDescription",
		img: {
			baseSrc: "./img/genderReveal_1.png",
			hoverSrc: [
			"./img/genderReveal_2.png", 
			"./img/genderReveal_3.png"
			]
		},
		href: "genderReveal.html"
	},
	{
		title: "cardNameRevealTitle",
		p: "cardNameRevealDescription",
		img: {
			baseSrc: "./img/wordle_1.png",
			hoverSrc: []
		},
		href: "wordle.html"
	},
	{
		title: "cardNameTournamentTitle",
		p: "cardNameTournamentDescription",
		img: {
			baseSrc: "./img/nameTournament_1.png",
			hoverSrc: [
			"./img/nameTournament_2.png"
			]
		},
		href: "nameTournament.html"
	}
];

function generateCard(card) {
	const appCard = document.createElement('div');
	appCard.className = 'app-card';
	appCard.setAttribute('cardId', cards.indexOf(card));
	appCard.setAttribute('onclick', 'window.location="' + card.href + '"');
	
	const title = document.createElement('h2');
	title.innerHTML = '<center data-i18n="' + card.title + '"></center>';
	appCard.appendChild(title);
	
	const p1 = document.createElement('p');
	if(card.p != null) {
		p1.setAttribute("data-i18n", card.p);
	}
	appCard.appendChild(p1);
	
	const p2 = document.createElement('p');
	if(card.img != null) {
		p2.classList.add("card_img_container");
		const img = document.createElement('img');
		img.src = card.img.baseSrc;
		p2.appendChild(img);
		
		appCard.setAttribute('onmouseover', 'updateCardImage(this, true)');
		appCard.setAttribute('onmouseout', 'updateCardImage(this, false)');
	}
	appCard.appendChild(p2);
	
	document.getElementById("app-list").appendChild(appCard);
}

function updateCardImage(card, over) {
	const c = cards[card.getAttribute('cardId')];

	if (!(
	  c.img &&
	  Array.isArray(c.img.hoverSrc) &&
	  c.img.hoverSrc.length > 0 &&
	  c.img.hoverSrc.some(src => typeof src === "string" && src.trim() !== "")
	)) return;
	
	let img = card.getElementsByTagName("img")[0];
	let src = over ? c.img.hoverSrc : c.img.baseSrc;
	
	if(Array.isArray(src) && src.length > 0) {
		const index = Math.floor(Math.random() * src.length);
		src = src[index];
	}
	
	img.setAttribute("src", src);
}
