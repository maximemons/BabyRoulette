//CONFIGS
const MAX_TRIES = 6;
let currentTry = 0;
let currentInput = "";
let azerty = currentLang == "fr";
let keyboardLayout = {
    azerty: ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p", "q", "s", "d", "f", "g", "h", "j", "k", "l", "m", "w", "x", "c", "v", "b", "n"],
    qwerty: ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "a", "s", "d", "f", "g", "h", "j", "k", "l", "z", "x", "c", "v", "b", "n", "m"]
};

const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

let NAME = "";
const isTutorial = isHomePage(5) === true;
let successMessage;
let failMessage;
let anywayMessage;

function init() {
    const params = isHomePage(5);

    azerty = currentLang == "fr";
    buildKeyboard();

    if(params == true) {
        NAME = clichesNames[currentLang][Math.floor(Math.random() * clichesNames[currentLang].length)].normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
        document.getElementById("newGame").removeAttribute("style");
    } else if(params != undefined) {
        NAME = params[0].normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

        let trElements = document.querySelectorAll("[data-i18n]");
        trElements.forEach(el => {
            if(["title"].includes(el.getAttribute("data-i18n"))) {
                el.setAttribute("data-i18n-stop", true);
            }
            if(el.getAttribute("data-i18n") == "title") {
                el.innerText = params[1];
                successMessage = params[2];
                failMessage = params[3];
                anywayMessage = params[4] == '' ? undefined : params[4];
            }
        });
    }

    currentInput = NAME.substr(0,1);

    document.getElementById("toggleKeyboard").setAttribute("data-i18n", azerty ? "switchToQWERTY" : "switchToAZERTY");
}


// === UI Init ===
const board = document.getElementById("board");
const keyboard = document.getElementById("keyboard");
const toggleBtn = document.getElementById("toggleKeyboard");

function buildBoard() {
    board.innerHTML = "";
    for (let i = 0; i < MAX_TRIES; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        if(isMobile && NAME.length > 10) {
            row.setAttribute("style", "gap:3px !important;")
        }
        for (let j = 0; j < NAME.length; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if(isMobile && NAME.length > 10) {
                let wh = -4*NAME.length + 80;
                let fs = -0.08*NAME.length + 2;
                cell.setAttribute("style", "width:" + wh + "px !important;height:" + wh + "px !important;font-size:" + fs + "rem");
            }
            if (NAME[j] === "-") {
                cell.textContent = "-";
                cell.classList.add("special");
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
    updateFirstLetter();
}

function updateFirstLetter() {
    const firstRow = board.children[0];
    for (let i = 0; i < NAME.length; i++) {
        if (NAME[i] !== "-") {
            firstRow.children[i].textContent = NAME[i].toUpperCase();
            break;
        }
    }
}

function handleKey(letter) {
    if (currentInput.length < NAME.length) {
        // Skip over special chars in word
        let pos = currentInput.length;
        while (NAME[pos] === "-" && pos < NAME.length) {
            currentInput += "-";
            pos++;
        }
        if (currentInput.length < NAME.length) {
            currentInput += letter;
            updateCurrentRow();
        }
    }
}

function buildKeyboard() {
    keyboard.innerHTML = "";
    const layout = azerty ? keyboardLayout.azerty : keyboardLayout.qwerty;
    layout.forEach(letter => {
        const key = document.createElement("button");
        key.classList.add("key");
        key.textContent = letter.toUpperCase();
        key.onclick = () => handleKey(letter);
        keyboard.appendChild(key);
    });
    const enterKey = document.createElement("button");
    enterKey.classList.add("key");
    enterKey.classList.add("keyGreen");
    enterKey.setAttribute("data-i18n", "sendValidate");
    enterKey.onclick = submitWord;
    keyboard.appendChild(enterKey);

    const delKey = document.createElement("button");
    delKey.classList.add("key");
    delKey.classList.add("keyRed");
    delKey.textContent = "⌫";
    delKey.onclick = () => {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            updateCurrentRow();
        }
    };
    keyboard.appendChild(delKey);
}

function updateCurrentRow() {
    const row = board.children[currentTry];
    for (let i = 0; i < NAME.length; i++) {
        const cell = row.children[i];
        cell.textContent = currentInput[i] ? currentInput[i].toUpperCase() : (NAME[i] === "-" ? "-" : "");
    }
}

function submitWord() {
    if (currentInput.length !== NAME.length) return;
    const row = board.children[currentTry];
    const inputArr = currentInput.toLowerCase().split("");
    const wordArr = NAME.split("");

    for (let i = 0; i < NAME.length; i++) {
        if (NAME[i] === "-") continue;
        const cell = row.children[i];
        if (inputArr[i] === wordArr[i]) {
            cell.classList.add("correct");
        } else if (wordArr.includes(inputArr[i])) {
            cell.classList.add("present");
        } else {
            cell.classList.add("absent");
        }
    }

    updateKeyboardColors();

    if (currentInput.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() === NAME) {    //WIN
        fireworks();
        if(isTutorial) {
            setTimeout(() => initPopup1(), 1500);
        } else {
            setTimeout(() => initPopupSuccessOrFail(successMessage, true), 1500);
        }
        
        disableInput();
        return;
    }

    currentTry++;
    if (currentTry >= MAX_TRIES) {  //FAIL
        explode();  
        if(isTutorial){
            setTimeout(() => initPopup1(), 1500);
        } else {
            setTimeout(() => initPopupSuccessOrFail(failMessage), 1500);
        }
        
        disableInput();
    }
    currentInput = NAME.substr(0,1);
    autoFillCorrectLetters();
}

function autoFillCorrectLetters() {
    const prevRow = board.children[currentTry - 1];
    const row = board.children[currentTry];
    if (!row) return;
    for (let i = 0; i < NAME.length; i++) {
        const cellAbove = prevRow.children[i];
        if (cellAbove.classList.contains("correct")) {
            row.children[i].textContent = cellAbove.textContent;
        }
    }

    let cells = row.getElementsByClassName("cell");
    for(let i = 1; i < cells.length; i++){
        if(cells[i].innerText == "") 
            return;
        currentInput += cells[i].innerText;
    }
}

function disableInput() {
    document.removeEventListener("keydown", keyListener);
}

function keyListener(e) {
    const letter = e.key.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (/^[a-z]$/.test(letter)) {
        handleKey(letter);
    } else if (e.key === "Enter") {
        submitWord();
    } else if (e.key === "Backspace") {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            updateCurrentRow();
        }
    }
}

function updateKeyboardColors() {
    let absentLetters = new Set();

    for (let i = 0; i <= currentTry; i++) {
        const row = board.children[i];
        for (let j = 0; j < NAME.length; j++) {
            const cell = row.children[j];
            if (cell.classList.contains("absent")) {
                absentLetters.add(cell.textContent.toLowerCase());
            }
        }
    }

    const keys = keyboard.querySelectorAll("button.key");
    keys.forEach(key => {
        if (absentLetters.has(key.textContent.toLowerCase())) {
            key.classList.add("absent");
        } else {
            key.classList.remove("absent");
        }
    });
}

toggleBtn.onclick = () => {
    azerty = !azerty;
    toggleBtn.textContent = azerty ? "Passer en QWERTY" : "Switch to AZERTY";
    buildKeyboard();
    updateKeyboardColors();
    translate();
};

document.addEventListener("keydown", keyListener);


buildBoard();


//FORMS
const formPopup1 = "<h2 data-i18n='popup1title'></h2><h4 data-i18n='popup1subTitle'></h4>";

function closePopupBis() {
    closePopup();
    document.addEventListener("keydown", keyListener);
}

function initPopup1() {
    disableInput();

    initPopup(formPopup1, "initPopup2", "bis", "bis");
}

function updateName(input) {
    document.getElementById("form_success").setAttribute("placeholder", t("popup2SuccessPh") + input.value);
    if(document.getElementById("form_anyway").getAttribute("placeholder") != null) {
        document.getElementById("form_anyway").setAttribute("placeholder", t("popup2AnywayPh") + input.value);
    }
}

const formPopup2 = "<form><label for='form_title' data-i18n='popup2Title'></label><input type='text' id='form_title' name='form_title' data-i18n-ph='popup2TitlePh'/><table><tr><td><label for='form_name' data-i18n='popup2Name'></label></td><td><sup class='required' id='form_name_required' data-i18n='required'></sup></td></tr></table><input type='text' id='form_name' name='form_name' onchange='updateName(this)'/><label for='form_success' data-i18n='popup2Success'></label><input type='text' id='form_success' name='form_success' data-i18n-ph='popup2SuccessPh'/><label for='form_fail' data-i18n='popup2Fail'></label><input type='text' id='form_fail' name='form_fail' data-i18n-ph='popup2FailPh'/><label for='form_anyway' data-i18n='popup2Anyway'></label><table><tr><td style='width:100%'><input type='text' id='form_anyway' name='form_anyway' data-i18n-ph='popup2AnywayPh'/></td><td><span style='cursor: pointer;font-weight: bold;color: #888;' onclick='document.getElementById(\"form_anyway\").removeAttribute(\"placeholder\");document.getElementById(\"form_anyway\").value=\"\"'>×</span></td></tr></table></form>";

let encodedValue = undefined;

function validateFormPopup2() {
    let form = document.getElementById("popup").getElementsByTagName("form");
    let title = document.getElementById("form_title");
    let name = document.getElementById("form_name");
    let formSuccess = document.getElementById("form_success");
    let formFail = document.getElementById("form_fail");
    let formAnyway = document.getElementById("form_anyway");

    if(name.value == "") {
        document.getElementById("form_name_required").setAttribute("style", "display: inline");
        name.classList.add("required");
        return;
    }else {
        document.getElementById("form_name_required").removeAttribute("style");
        name.classList.remove("required");
    }

    let valueToSubmit = name.value + ';' + valueOrPlaceHolder(title) + ';' + valueOrPlaceHolder(formSuccess) + ';' + valueOrPlaceHolder(formFail) + ';' + valueOrPlaceHolder(formAnyway);
    encodedValue = encode(valueToSubmit);

    initPopup3();
}

function initPopup2() {
    disableInput();
    initPopup(formPopup2, "validateFormPopup2", "bis", "bis");
}

const formPopup3 = "<div style='display: flex;flex-direction: column;gap: 10px;'><h2 data-i18n='shareLinkCloseOnes'></h2><input type='text' id='form_copy_input' class='form_copyInput' readonly><button class='form_copyBtn' id='form_copyBtn' data-i18n='copy' onclick='form_copy(this)'></button></div";

function initPopup3() {
    initPopup(formPopup3, undefined, undefined);
    document.getElementById("form_copy_input").value = document.location.href.replace(/\?q?.*$/, "") + "?q=" + encodedValue;
}

function initPopupAnyway() {
    initPopup("<h2>" + anywayMessage + "</h2>");
}

function initPopupSuccessOrFail(message, succes) {
    disableInput();

    let content = "<h2>" + message + "</h2>";

    if(!(succes === true)){
        if(anywayMessage != undefined) {
            content += "<div class='popup-buttonRow'>";
            content += "<button class='popup-next' data-i18n='continue' onclick='initPopupAnyway()'></button>"
            content += "</div>";
        }
    }

    initPopup(content);
}