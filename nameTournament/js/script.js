let choices = [];

let currentRound = [];
let nextRound = [];
let index = 0;
let roundNumber = 1;
let totalRounds = 1;

const choicesDiv = document.getElementById("choices");
const finalDiv = document.getElementById("final");
const roundInfo = document.getElementById("roundInfo");
const treeLevels = document.getElementById("treeLevels");

let uuid = "";

let roundLibelle;
let gameLibelle;
let overLibelle;
let finalChoiceLibelle;

async function init() {
  const params = isHomePage(3);
  roundLibelle = t("round");
  gameLibelle = t("game");
  overLibelle = t("over");
  finalChoiceLibelle = t("finalChoice");

  if(params == true) {
    let halfList = clichesNames[currentLang].length / 2;
    choices = shuffle(Math.random() < 0.5 ? clichesNames[currentLang].slice(0, halfList) : clichesNames[currentLang].slice(halfList));
    document.getElementById("newGame").removeAttribute("style");
  }else if(params != undefined) {
    let title = params[0];
    choices = shuffle(JSON.parse(params[1]));
    uuid = params[2];
    let trElements = document.querySelectorAll("[data-i18n]");
    trElements.forEach(el => {
      if(["title"].includes(el.getAttribute("data-i18n"))) {
        el.setAttribute("data-i18n-stop", true);
      }
      if(el.getAttribute("data-i18n") == "title") {
        el.innerText = title;
      }
    });
  }

  if(new URLSearchParams(document.location.search).get("result") != null) {
    document.getElementById("container").setAttribute("style", "height:292px");
    document.getElementById("makeChoice").remove();
    let finalResults = await getResults();
    displayPodium(finalResults);
    
    document.getElementById("linkToShare").value = document.location.href.replaceAll("&result=true", "");
    document.getElementById("containerLink").style.removeProperty("display");

  } else {
    currentRound = [...choices];
    totalRounds = Math.ceil(Math.log2(choices.length));
    showNextPair();
  }
}

function updateTreeLevels() {
  treeLevels.innerHTML = "";
  for (let i = 1; i <= totalRounds; i++) {
    const level = document.createElement("div");
    const span = document.createElement("span");
    span.innerText = gameLibelle;
    level.appendChild(span);
    const number = document.createElement("span");
    level.className = "level " + (i === roundNumber ? " active" : "");
    number.textContent = ` ${i}`;
    level.appendChild(number);
    treeLevels.appendChild(level);
  }
}

function showNextPair() {
  choicesDiv.innerHTML = "";
  finalDiv.textContent = "";
  updateTreeLevels();
  roundInfo.textContent = `${gameLibelle} ${index / 2 + 1} ${overLibelle} ${Math.ceil(currentRound.length / 2)}`;

  if (currentRound.length === 1) {
    roundInfo.textContent = "";
    treeLevels.innerHTML = "";
    finalDiv.textContent = `${finalChoiceLibelle} ${currentRound[0]}`;
    upVote(uuid+currentRound[0]);
    fireworks();
    return;
  }

  if (index >= currentRound.length) {
    currentRound = [...nextRound];
    nextRound = [];
    index = 0;
    roundNumber++;
    showNextPair();
    return;
  }

  const choiceA = currentRound[index];
  const choiceB = currentRound[index + 1];

  const buttonA = document.createElement("button");
  buttonA.className = "choice";
  buttonA.textContent = choiceA;
  buttonA.onclick = () => {
    nextRound.push(choiceA);
    index += 2;
    showNextPair();
  };

  const buttonB = document.createElement("button");
  buttonB.className = "choice";
  buttonB.textContent = choiceB;
  buttonB.onclick = () => {
    nextRound.push(choiceB);
    index += 2;
    showNextPair();
  };

  choicesDiv.appendChild(buttonA);
  if (choiceB !== undefined) choicesDiv.appendChild(buttonB);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateNameInput(first) {
  const uuid = crypto.randomUUID();
  let remove = "<span onclick='removeNameInput(\""+uuid+"\")'>×</span>";

  if(first === true) {
    remove = "";
  }
  return  "<label class='labelName input"+uuid+"' data-i18n='name'></label><table class='input"+uuid+"'><tbody><tr><td style='width:100%'><input class='inputName' type='text'/></td><td>"+remove+"</td></tr></table>";
}

function translateNamesInput() {
  translate();

  const labels = document.getElementsByClassName("labelName");
  for(let i = 0; i < labels.length; i++) {
    let label = labels[i];
    label.innerText += " " + (i + 1) + " :";
  }
}

function appendPopupNameInput(input) {
  console.log(input, input.split("</label>"));

  let popupContent = document.getElementsByClassName("popup-content")[0];
  let formPopup = popupContent.getElementsByTagName("form")[0];

  let label = document.createElement("label");
  label.innerHTML = input.split("</label>")[0] + "</label>";
  let table = document.createElement("table");
  table.innerHTML = input.split("</label>")[1];
  let classTitle = input.split("<table class='")[1].split("'><tbody>")[0];
  table.classList.add(classTitle);

  formPopup.appendChild(label);
  formPopup.appendChild(table);
  translateNamesInput();
}

function removeNameInput(id) {
  let elementsToRemove = document.getElementsByClassName("input" + id);
  elementsToRemove[1].remove();
  elementsToRemove[0].remove();
  translateNamesInput();
}

const formPopup2 = "<div style='display: flex;flex-direction: column;gap: 10px;'><h2 data-i18n='shareLinkCloseOnes'></h2><input type='text' id='form_copy_input' class='form_copyInput' readonly><button class='form_copyBtn' id='form_copyBtn' data-i18n='copy' onclick='form_copy(this)'></button></div><div style='display: flex;flex-direction: column;gap: 10px;'><h2 data-i18n='linkForResult'></h2><input type='text' id='form_copy_input2' class='form_copyInput' readonly><button class='form_copyBtn' id='form_copyBtn2' data-i18n='copy' onclick='form_copy(this, \"form_copy_input2\")'></button></div>";

function initPopup2() {
  initPopup(formPopup2, undefined, undefined);
  document.getElementById("form_copy_input").value = document.location.href.replace(/\?q?.*$/, "") + "?q=" + encodedValue;
  document.getElementById("form_copy_input2").value = document.location.href.replace(/\?q?.*$/, "") + "?q=" + encodedValue + "&result=true";
}

let encodedValue = undefined;

function validateFormPopup1() {
  let popupContent = document.getElementsByClassName("popup-content")[0];
  let formPopup = popupContent.getElementsByTagName("form")[0];

  let names = formPopup.getElementsByTagName("input");
  let finalNames = [];

  const uuid = crypto.randomUUID();

  for(let i = 0; i < names.length; i++) {
    let name = names[i].value.trim();
    if(name.length > 0) {
      finalNames.push(name);
      setValue(uuid+name, 0);
    }
  }

  if(finalNames.length > 1) {
    let title = valueOrPlaceHolder(document.getElementById("titlePopup1"));
    let queryToSend = title+";"+JSON.stringify(finalNames)+";"+uuid;
    encodedValue = encode(queryToSend);

    closePopup();
    initPopup2();

  } else {
    alert(t("atLeastTwo"));
  }
}

const formPopup1 = "<form><label data-i18n='titlePopup1'></label><input id='titlePopup1' type='text' data-i18n-ph='titlePopup1Ph'><div class='separator'></div></form><center><button style='width:100%; margin-top:20px' onclick='appendPopupNameInput(generateNameInput())'>+</button></center>";

function initPopup1() {
  initPopup(formPopup1, "validateFormPopup1", true, true);

  appendPopupNameInput(generateNameInput(true));
  appendPopupNameInput(generateNameInput(true));
}

function getTopThreeGroups(data) {
  const sorted = [...data].sort((a, b) => b.result - a.result);

  const topScores = [...new Set(sorted.map(p => p.result))].slice(0, 3);

  const result = {
    top: sorted.filter(p => p.result === topScores[0]),
    mid: sorted.filter(p => p.result === topScores[1]),
    last: sorted.filter(p => p.result === topScores[2]),
  };

  if(result.top.length == 0) {
    result.top = [{"name": "", "result": "0"}];
  }
  if(result.mid.length == 0) {
    result.mid = [{"name": "", "result": "0"}];
  }
  if(result.last.length == 0) {
    result.last = [{"name": "", "result": "0"}];
  }

  return result;
}

const podium = document.getElementById('podium');

function displayPodium(data, animation) {
  const bronzeStep = createStep('bronze', data.last);
  const silverStep = createStep('silver', data.mid);
  const goldStep = createStep('gold', data.top);
  const refresh = createStep(undefined, undefined, true);

  podium.appendChild(silverStep);
  podium.appendChild(goldStep);
  podium.appendChild(bronzeStep);
  podium.appendChild(refresh);


  if(animation === false) {
    bronzeStep.classList.add('show');
    silverStep.classList.add('show');
    goldStep.classList.add('show');
    refresh.classList.add('show');
  }else {
    setTimeout(() => bronzeStep.classList.add('show'), 500);
    setTimeout(() => silverStep.classList.add('show'), 1000);
    setTimeout(() => goldStep.classList.add('show'), 1500);
    setTimeout(() => refresh.classList.add('show'), 1500);
    setTimeout(() => fireworks(), 2000);
  }

  translate();
}

let autoRefreshTimeout = null;

function createStep(className, participants, refresh) {
  const step = document.createElement('div');
  step.classList.add('step', className);

  if(refresh === true) {
    const btn = document.createElement("button");
    btn.innerText = "↺";
    btn.classList.add("refreshPodium");
    btn.setAttribute("title", "refresh");
    btn.setAttribute("onclick", "refreshPodium()");
    btn.setAttribute("style", "width: 100%");
    step.appendChild(btn);
    const table = document.createElement("table");
    table.setAttribute("style", "color: black;text-align: left;");
    table.innerHTML = "<table><tbody><tr><td data-i18n-tl='every30Sec'><input type='checkbox'></td><td data-i18n='autoRefresh'></td></tr></tbody></table>";
    step.appendChild(table);
    let radio = table.getElementsByTagName("input")[0];
    radio.addEventListener("change", () => {
      if(radio.checked) {
        autoRefreshTimeout = setTimeout(() => { refreshPodium(true); }, 1000 * 30); //30 sec
      }else {
        clearTimeout(autoRefreshTimeout);
        autoRefreshTimeout = null;
      }
      sessionStorage.setItem("autoRefresh", radio.checked);
    });

    let isAutoRefresh = sessionStorage.getItem("autoRefresh") === "true";
    radio.checked = isAutoRefresh;
    if(isAutoRefresh) {
      autoRefreshTimeout = setTimeout(() => { refreshPodium(true); }, 1000 * 30); //30 sec
    }
  }else {
    const names = document.createElement('div');
    names.className = 'names';
    names.textContent = participants.map(p => p.name).join(', ');

    const results = document.createElement('div');
    results.className = 'result';
    results.textContent = `Score: ${participants[0].result}`;

    step.appendChild(names);
    step.appendChild(results);
  }

  return step;
}

async function refreshPodium(withoutAnimation) {
  console.log("🏆 Podium refreshed");
  let results = await getResults();
  podium.innerHTML = "";
  if(withoutAnimation === true ){
    displayPodium(results, false);
  } else {
    clearAnimations();
    displayPodium(results);
  }
}

async function getResults() {
  let results = [];

  for(let i = 0; i < choices.length; i++) {
    let id = uuid+choices[i];
    let result = await getCounter(id);

    results.push({"name": choices[i], "result": result});
  }

  return getTopThreeGroups(results);
}

function copyLinkToShare(el) {
  let link = document.getElementById('linkToShare');

  const copyLabel = "✂️";
  const copiedLabel = "📋";

  link.select();
  document.execCommand("copy");

  el.classList.add("copied");
  el.innerText = copiedLabel;

  setTimeout(() => {
    el.classList.remove("copied");
    el.innerText = copyLabel;
  }, 1500);
}