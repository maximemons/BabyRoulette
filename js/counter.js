const COUNTERAPIBASE = "https://countapi.mileshilliard.com/api/v1/";

const COUNTERVIEWS = "babyrouletteviews";

async function get(url) {
    try {
        const response = await fetch(url);
        if (response.status === 200) {
            const data = await response.json();
            return { success: true, content: data };
        } else {
            throw new Error("Erreur HTTP : " + response.status);
        }
    } catch (error) {
        return { success: false, content: error.message };
    }
}

async function upVote(id) {
    let getVote = await get(COUNTERAPIBASE + "hit/" + id);
    return getVote.status;
}

async function downVote(id) {
    let getVote = await get(COUNTERAPIBASE + "get/" + id);
    if (getVote.success) {
        let currentValue = parseInt(getVote.content.value) - 1;
        if (currentValue < 0) {
            currentValue = 0;
        }
        let updateVote = await get(COUNTERAPIBASE + "set/" + id + "?value=" + currentValue);
        return updateVote.success;
    }
}

async function setValue(id, value) {
    let setVote = await get(COUNTERAPIBASE + "set/" + id + "?value=" + value);
    return setVote.status;
}

async function addView(id) {
	if(!(id === null || id === undefined))
		await upVote(COUNTERVIEWS + id);
	await upVote(COUNTERVIEWS);
}

async function getCounter(id) {
	let getVote = await get(COUNTERAPIBASE + "get/" + id);
	if (getVote.success) {
		return getVote.content.value;
	}
	return "Something went wrong getting value";
}

async function getViews(id) {
	console.log(COUNTERVIEWS + (id || ""));
	let getView = await getCounter(COUNTERVIEWS + (id || ""));

	return getView;
}


let loc = window.location.href.split("/");
loc = loc[loc.length - 1].replace(".html", "").toLowerCase();

addView(loc);