//TRANSLATION
let dictionary;
let currentLang;

const langsList = ["en", "fr", "es", "de", "it", "pt", "nl"];

function initTranslation(translations, lang) {
	if(lang == undefined) {
		lang = navigator.language.toLocaleLowerCase().split("-")[0];
	}
	if(lang === undefined || !langsList.includes(lang)) {
		lang = "en";
	}
	currentLang = lang.toLowerCase();;

	if(!Array.isArray(translations)) {
		dictionary = translations;
		return; 
	}

	dictionary = translations[0];

	if(translations.length > 1) {
		for(var i = 1; i < translations.length; i++) {
			const mergedTranslations = {};
			const languages = new Set([
				...Object.keys(dictionary),
				...Object.keys(translations[i])
				]);

			languages.forEach(lang => {
				mergedTranslations[lang] = {
					...(dictionary[lang] || {}),
					...(translations[i][lang] || {})
				};
			});

			dictionary = mergedTranslations;
		}
	}
}

function translate() {
	const elements = document.querySelectorAll("[data-i18n]");
	elements.forEach(el => {
		const key = el.getAttribute("data-i18n");
		if(el.getAttribute("data-i18n-stop") == null) {
			el.textContent = t(key);
		}
	});
	const elementsPh = document.querySelectorAll("[data-i18n-ph]");
	elementsPh.forEach(el => {
		const key = el.getAttribute("data-i18n-ph");
		if(el.getAttribute("data-i18n-stop") == null) {
			el.setAttribute("placeholder", t(key));
		}
	});
	const elementsTl = document.querySelectorAll("[data-i18n-tl]");
	elementsTl.forEach(el => {
		const key = el.getAttribute("data-i18n-tl");
		if(el.getAttribute("data-i18n-stop") == null) {
			el.setAttribute("title", t(key));
		}
	});
}

function t(key) {
	return dictionary[currentLang]?.[key] || key;
}

function initLangSwitch() {
	const toggleLangBtn = document.getElementById('toggleLangBtn');
	document.getElementById("langSwitcher").removeAttribute("style");
	let langLabel = document.getElementById("toggleLangBtn").getElementsByTagName("span")[0];
	let langList = document.getElementById("langList");

	langLabel.innerText = currentLang;
	langsList.forEach(l => {
		let li = document.createElement("li");
		li.innerText = l.toUpperCase();
		li.setAttribute("data-lang", l.toLowerCase());
		langList.appendChild(li);
	});

	toggleLangBtn.addEventListener('click', () => {
		langList.style.display = langList.style.display === 'block' ? 'none' : 'block';
	});

	langList.querySelectorAll('li').forEach(item => {
		item.addEventListener('click', () => {
			const selectedLang = item.getAttribute('data-lang');
			langList.style.display = 'none';
			langLabel.innerText = selectedLang;
			currentLang = selectedLang;
			translate();
		});
	});

	document.addEventListener('click', (event) => {
		if (!document.getElementById('langSwitcher').contains(event.target)) {
			langList.style.display = 'none';
		}
	});
}


//FOOTER
let footers = document.getElementsByTagName("footer");
if(footers.length == 1) {
	footers[0].innerHTML = "<center><table><tr><td colspan='2'><span>&copy;<span id='year'></span> Maxime Mons. <span data-i18n='allRightReserved'></span></span></td></tr><tr><td><center><a href='https://github.com/maximemons/BabyRoulette' target='_blank' class='footer-link' id='github' data-i18n='viewOnGitHub'></a></center></td><td><center><a href='https://www.paypal.com/donate/?hosted_button_id=MBLHARVDYVX2S' target='_blank' class='footer-link' id='paypal' data-i18n='supportViaPaypal'></a></center></td></tr></table></center>";
	document.getElementById('year').textContent = new Date().getFullYear();
}


//ENCODE/DECODE
function encode(value) {
	var uriEncoded = encodeURIComponent(value);
	return btoa(uriEncoded);
}

function decode(value, size) {
	let base64Decoded = atob(value);
	let result = decodeURIComponent(base64Decoded);

	let resultLength = result.split(";").length;
	if(resultLength == size) {
		return result.split(";");
	}
	return undefined;
}


//ISHOMEPAGE
function isHomePage(size) {
	const params = new URLSearchParams(document.location.search).get("q");

	if(params != null) { //q param, not home page
		let decodeQueryParam = decode(params, size);
		if(decodeQueryParam === undefined || decodeQueryParam === null) {
			document.location.search = "";
			return;
		}
		return decodeQueryParam;
	}
	return true;
}


//ANIMATIONS
function fireworks() {
	const canvas = document.getElementsByTagName("canvas")[0];
	const ctx = canvas.getContext("2d");
	
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	let particles = [];
	for (let i = 0; i < 100; i++) {
		particles.push({
			x: canvas.width / 2,
			y: canvas.height / 2,
			vx: (Math.random() - 0.5) * 10,
			vy: (Math.random() - 0.5) * 10,
			alpha: 1,
			radius: Math.random() * 3 + 2,
			color: `hsl(${Math.random() * 360}, 100%, 50%)`
		});
	}

	function draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particles.forEach((p) => {
			p.x += p.vx;
			p.y += p.vy;
			p.alpha -= 0.01;
			ctx.globalAlpha = p.alpha;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
			ctx.fill();
		});
		ctx.globalAlpha = 1;
		particles = particles.filter((p) => p.alpha > 0);
		if (particles.length > 0) {
			requestAnimationFrame(draw);
		}
	}
	draw();
}

function explode() {
	const canvas = document.getElementsByTagName("canvas")[0];
	const ctx = canvas.getContext("2d");

	let particles = [];

	for (let i = 0; i < 40; i++) {
		particles.push({
			x: canvas.width / 2,
			y: canvas.height / 2,
			vx: (Math.random() - 0.5) * 4,
			vy: (Math.random() - 0.5) * 4,
			alpha: 1
		});
	}

	function drawSmoke() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		particles.forEach(p => {
			ctx.beginPath();
			ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
			ctx.fillStyle = `rgba(0,0,0,${p.alpha})`;
			ctx.fill();
			p.x += p.vx;
			p.y += p.vy;
			p.alpha -= 0.01;
		});
		particles = particles.filter(p => p.alpha > 0);
		if (particles.length > 0) requestAnimationFrame(drawSmoke);
	}
	drawSmoke();
}

function clearAnimations() {
	const canvas = document.getElementsByTagName("canvas")[0];
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//FORM
function initPopup(html, fctValidate, btnCancel, cross) {
	closePopup();

    let popup = document.getElementById("popup");

    let content = popup.getElementsByClassName("popup-content")[0];

    if(cross === true || cross == "bis") {
    	html = "<button class='form_closeIcon' onclick='closePopup" + (cross == "bis" ? "Bis" : "") + "()''>✕</button>" + html;
    }
    
    if(fctValidate != undefined || btnCancel != undefined) {
    	html += "<div class='popup-buttonRow'>";
    }

    if(fctValidate != undefined) {
        html += "<button class='popup-next' data-i18n='create' onclick='" + fctValidate + "()'></button>";
    }
    if(btnCancel != undefined && btnCancel != false) {
        html += "<button class='popup-cancel' data-i18n='cancel' onclick='closePopup" + (btnCancel == "bis" ? "Bis" : "") + "()'></button>"; 
    }

    if(fctValidate != undefined || btnCancel != undefined) {
    	html += "</div>";
    }

    content.innerHTML = html;

    translate();

    document.getElementById("popup").setAttribute("style", "display: flex");
}

function closePopup() {
    document.getElementById("popup").setAttribute("style", "display: none");
}

function valueOrPlaceHolder(el) {
    if(el.value == "") {
        let placeholder = el.getAttribute("placeholder");
        if(placeholder != null) {
            return placeholder;
        }
    }
    return el.value;
}

function form_copy(btn, id) {

	let link = document.getElementById('form_copy_input'); 
	if(id != undefined) {
		link = document.getElementById(id);
	}
	
	const copyLabel = t("copy");
    const copiedLabel = t("copied");

    link.select();
    document.execCommand("copy");
    btn.classList.add("form_copied");
    btn.innerText = copiedLabel;

    setTimeout(() => {
      btn.classList.remove("form_copied");
      btn.innerText = copyLabel;
    }, 1500);
}