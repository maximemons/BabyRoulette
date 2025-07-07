const counterTotalViews = document.getElementById("counterTotalViews");
const counterViewsIndex = document.getElementById("counterViewsIndex");
const counterViewsGenderReveal = document.getElementById("counterViewsGenderReveal");
const counterViewsWordle = document.getElementById("counterViewsWordle");
const counterViewsAbout = document.getElementById("counterViewsAbout");

async function initViews() {
	counterTotalViews.innerText = await getViews();
	counterViewsIndex.innerText = await getViews("index");
	counterViewsGenderReveal.innerText = await getViews("genderreveal");
	counterViewsWordle.innerText = await getViews("wordle");
	counterViewsAbout.innerText = await getViews("about");
}

initViews();