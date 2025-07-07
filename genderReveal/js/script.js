//CONFIGS
let isMale = true;
let counter = 0;

let symbolBoy = "♂️";
let symbolGirl = "♀️";

const slots = [document.getElementById("slot1"), document.getElementById("slot2"), document.getElementById("slot3")];
const lever = document.getElementById("lever");
const leverContainer = document.getElementById("lever-container");
const resultText = document.getElementById("result");

let congrats;
let fail;

const isTutorial = isHomePage(6) === true;

function init() {
    const params = isHomePage(6);

    if (params == true) {
        symbolBoy = t("genderBoySymbol");
        symbolGirl = t("genderGirlSymbol");
        
        document.getElementById("newGame").removeAttribute("style");
    } else if (params != undefined) {
        isMale = params[0] === "1";
        const elements = document.querySelectorAll("[data-i18n]");
        elements.forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (key === 'title') {
                el.innerText = params[1];
            }
        });

        symbolBoy = params[2];
        symbolGirl = params[3];
        congrats = params[4];
        fail = params[5];
    }
}

function getSymbol() {
    return Math.random() > 0.5 ? symbolBoy : symbolGirl;
}

function createReelElement(symbol) {
    const el = document.createElement("div");
    el.textContent = symbol;
    return el;
}

async function spinReel(slot, finalSymbol, delay) {
    return new Promise((resolve) => {
        let spins = 10 + Math.floor(Math.random() * 10);
        let count = 0;
        const interval = setInterval(() => {
            const symbol = getSymbol();
            slot.innerHTML = "";
            slot.appendChild(createReelElement(symbol));
            count++;
            if (count >= spins) {
                clearInterval(interval);
                setTimeout(() => {
                    slot.innerHTML = "";
                    slot.appendChild(createReelElement(finalSymbol));
                    resolve();
                }, delay);
            }
        }, 100);
    });
}

let isClicked = false;

lever.addEventListener("click", async () => {
    if (isClicked) return;

    counter++;

    isClicked = true;
    lever.classList.remove("idle");
    lever.classList.remove("paused");
    lever.classList.add("pulled");

    resultText.textContent = "";
    let answerSymbol = " ";

    answerSymbol = isMale ? symbolBoy : symbolGirl;

    let result;
    do {
        let resultSymbols = [getSymbol(), getSymbol(), getSymbol()];

        result = resultSymbols;

    } while (result.filter((s) => s === answerSymbol).length !== 3 && Math.random() > 0.3);

    if(!isTutorial && counter == 6) {
        result = [answerSymbol, answerSymbol, answerSymbol];
    }else {
        const isResultEqual = areSymbolsEquals(result);
        const targetSymbol = isMale ? symbolGirl : symbolBoy;
        
        if (isResultEqual && (isTutorial || counter === 1 || result[0] === targetSymbol)) {
            const idx = Math.floor(Math.random() * 3);
            result[idx] = result[idx] == symbolBoy ? symbolGirl : symbolBoy;
        }
    }

    await Promise.all([
        spinReel(slots[0], result[0], 0),
        spinReel(slots[1], result[1], 100),
        spinReel(slots[2], result[2], 200)
    ]);

    if (result.every((s) => s === answerSymbol) && isMale != null) {
        resultText.textContent = congrats;
        fireworks();
    } else {
        if (isTutorial) {
            resultText.textContent = t("createFirst");
        } else {
            resultText.textContent = fail;
        }
    }

    setTimeout(() => {
        lever.classList.remove("pulled");
        lever.classList.add("idle");
        isClicked = false;
        updateIdleState();
    }, 500);
});

function areSymbolsEquals(symbols) {
    return symbols[0] === symbols[1] && symbols[1] === symbols[2];
}

function updateIdleState() {
    if (!isClicked && !leverContainer.matches(":hover")) {
        lever.classList.remove("paused");
    } else {
        lever.classList.add("paused");
    }
}

leverContainer.addEventListener("mouseenter", updateIdleState);
leverContainer.addEventListener("mouseleave", updateIdleState);

let encodedValue = "";

//FORMS
function validatePopup1() {
    let form = document.getElementById("form_popup1");
    let title = document.getElementById("form_title");
    let gender = document.getElementById("form_gender").value;
    let symbol1 = document.getElementById("form_emoji1");
    let symbol2 = document.getElementById("form_emoji2");
    let success = document.getElementById("form_success");
    let fail = document.getElementById("form_fail");

    let valueToSubmit = gender + ';' + valueOrPlaceHolder(title) + ';' + valueOrPlaceHolder(symbol1) + ';' + valueOrPlaceHolder(symbol2) + ';' + valueOrPlaceHolder(success) + ';' + valueOrPlaceHolder(fail);
    encodedValue = encode(valueToSubmit);

    initPopup2();
}

const formPopup2 = "<div style='display: flex;flex-direction: column;gap: 10px;'><h2 data-i18n='shareLinkCloseOnes'></h2><input type='text' id='form_copy_input' class='form_copyInput' readonly><button class='form_copyBtn' id='form_copyBtn' data-i18n='copy' onclick='form_copy(this)'></button></div";

function initPopup2() {
    closePopup();

    initPopup(formPopup2, undefined, undefined, true);
    document.getElementById("form_copy_input").value = document.location.href.replace(/\?q?.*$/, "") + "?q=" + encodedValue;
}

const formPopup1 = "<div><h2 data_i18n='popup1Title'></h2><form id='form_popup1'><label id='formTitle' for='form_title' data-i18n='popup1Title'></label><input type='text' id='form_title' name='form_title' data-i18n-ph='popup1TitlePh'><label id='formGender' for='form_gender' data-i18n='popup1Gender'></label><select id='form_gender' name='form_gender' onchange='form_changeGender(this)'><option id='formGenderBoy' value='1' data-i18n='popup1GenderBoy'></option><option id='formGenderGirl' value='2' data-i18n='popup1GenderGirl'></option></select><label id='formSymbols' data-i18n='popup1Symbols'></label><div class='form_emojiContainer'><input type='text' class='form_emojiInput' id='form_emoji1' maxlength='2' data-i18n-ph='genderBoySymbol'><input type='text' class='form_emojiInput' id='form_emoji2' maxlength='2' data-i18n-ph='genderGirlSymbol'></div><label id='formOnSuccess' for='form_success' data-i18n='popup1Success'></label><input type='text' id='form_success' name='form_success' data-i18n-ph='popup1SuccessPhBoy'><label id='formOnFail' for='form_fail' data-i18n='popup1Fail'></label><input type='text' id='form_fail' name='form_fail' data-i18n-ph='popup1FailPh'></form></div>";

function form_changeGender(select) {
    const success = document.getElementById("form_success");

    success.setAttribute("placeholder", (select.value == "1" ? t("popup1SuccessPhBoy") : t("popup1SuccessPhGirl")));
}

function initPopup1() {
    initPopup(formPopup1, "validatePopup1", true, true);
}