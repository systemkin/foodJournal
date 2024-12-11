let loggedIn = false;
let timeOffset = new Date().getTimezoneOffset()/(-60)
let craftingMeal = []
let menuState = false;
let userIncomes = [];
let userGoals = {protein:-1, fat:-1, carbs:-1};
debugger;
modalWindows = ["account", "mainWindow", "menu", "plate", "favorites", "results", "goals", "settings", "info"];
let lastIngid = 0;
let fav_id = 0


async function sendRegisterRequest(login, password) {
    const response = await fetch("/accounts", {
        method: "POST",
        headers: {
                'Content-Type': 'application/json'
            },
        body: JSON.stringify({
            login: login,
            pass: password
        })
    });
    if (response.status === 200)
        return;
    throw response.status;

}
function register() {
    let login = document.getElementById("usernameRegisterLine").value;
    let password = document.getElementById("passwordRegisterLine").value;
    sendRegisterRequest(login, password).then(() => registerSuccessful(login), (status) => registerFailed(login, status));
}
async function login() {
    let username = document.getElementById("usernameLoginLine").value;
    let password = document.getElementById("passwordLoginLine").value;
    const response = await fetch("/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            login: username,
            pass: password})
    })
    if (response.status === 200) {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function logoff() {
    const response = await fetch("/login", {
        method: "DELETE",
    })
    if (response.status === 200) {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}


function registerSuccessful(login) {
    document.getElementById("messagesWindow").innerHTML = login;
}
function registerFailed(login, status) {
    document.getElementById("messagesWindow").innerHTML = status;
}


async function postMeal(meal) {
    const mealString = JSON.stringify(meal)
    const response = await fetch("/incomes", {
        method: "POST",
        headers: {
                        'Content-Type': 'application/json'
                    },
        body: JSON.stringify({
            json: mealString
        })
    })
    document.getElementById("messagesWindow").innerHTML = response.status;
}
async function saveMeal() {
    let meal = {};
    let quantity = document.getElementById("amni").value
    if(document.getElementById("selm").value == "gram") {
        if (quantity == "") {quantity = 100}
        quantity /= 100;
    } else {
        if (quantity == "") {quantity = 1}
    }
    meal.title = document.getElementById("titi").value
    if (meal.title == "") {
        meal.title = "No Title";
    };
    meal.protein = quantity*document.getElementById("proi").value;
    if (meal.protein == "") {
            meal.protein = "0";
    };
    meal.fat = quantity*document.getElementById("fati").value;
    if (meal.fat == "") {
                meal.fat = "0";
        };
    meal.carbs = quantity*document.getElementById("cari").value;
    if (meal.carbs == "") {
        meal.carbs = "0";
    };
    meal.date = new Date().toISOString().split(".")[0];
    meal.type = document.getElementById("selm").value;
    if (document.getElementById("favI").dataset.selected == "1") {
            if (meal.title == "") {
                document.getElementById("messagesWindow").innerHTML = "Missing title";
                return;

            } else {
                postPreference(meal);
            }
    }
    postMeal(meal)

}

async function saveFullPlate() {
    let meal = getCraftedMeal();
    meal.title = document.getElementById("titlePlate").value;
    if (meal.title == "")
        meal.title = "No Title";
    postMeal(meal);
    if (document.getElementById("favD").dataset.selected == "1") {
        postPreference(meal);
    }
}
async function savePlate() {
    let meal = getCraftedMeal();
    meal.title = document.getElementById("plateTitle2").value;
        if (meal.title == "")
            meal.title = "No Title";
    postMeal(meal);
    if (document.getElementById("favP").dataset.selected == "1") {
        postPreference(meal);
    }
}

function getCraftedMeal() {
    return countMeals(craftingMeal);
}

function countMeals(meals) {
    let finalMeal = {};
    meals.forEach(meal => {
        let mealKeys = Object.keys(meal);
        mealKeys.forEach(key => {
            if (finalMeal[key]) {
                finalMeal[key] += meal[key];
            } else {
                finalMeal[key] = meal[key];
            }
        });
    });
    return finalMeal;
}

async function postPreference(preference) {
    const preferenceString = JSON.stringify(preference);
    const response = await fetch("/preferences", {
        method: "POST",
        headers: {
                        'Content-Type': 'application/json'
                    },
        body: JSON.stringify({
            json: preferenceString
        })
    })
    document.getElementById("messagesWindow").innerHTML = response.status;
}

async function getPrefs() {
    const response = await fetch("/preferences", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        },
    });
    if (response.status === 200) {
        preferences = await response.json();
        return preferences
    }
    else throw response.status;
}
let preferences;
getPrefs().then(() => {rebuildFavs()});

function rebuildFavs() {
   fav = document.getElementById("favBox")
   fav.innerHTML = "";
   preferences.forEach(pref => {
       preference = JSON.parse(pref.json);
       fav_id++;
       elem = document.createElement("div");
       elem.style = "border: solid 2px black; border-radius: 5px; margin-bottom: 10px;"
       elem.id = "FAVBOX_" + pref.id;
       elem.className = "plateElem";
       elem.innerHTML = `
       <div style='display:flex; flex-direction: row; justify-content: space-between; padding-top:10px; padding-right:10px'>
        <div style='display:flex; flex-direction: column; padding: 20px 30px 20px 30pxж'>
         <div style='display:flex; flex-direction: row; justify-content: space-between; padding-right: 10px;'>
          <span> `+preference.title+`:</span>
        </div>
       <span>`+preference.protein+`/`+preference.fat+`/`+preference.carbs+` - ` + (preference.protein*4+preference.fat*9+preference.carbs*4)+`kcal</span>
      </div>
      <img class = "buttonImg", style = "width: 60px; height:60px" src = "assets/images/delete.png" onclick = "deleteFavorites('` + pref.id + `')">
    </div>`;
    fav.appendChild(elem);
    })
}

async function getGoals() {
    const response = await fetch("/goals", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        },
    });
    if (response.status === 200) {
        goals = await response.json();
        return goals
    } else if (response.status === 204) return null
    else throw response.status;
}







function showPrefs(element, sorter) {
    debugger;
    element = document.getElementById(element);
    element.innerHTML = "";
    let prefType = "";
    if (document.getElementById(sorter) != null)
        prefType = document.getElementById(sorter).value;
    preferences.forEach(preference => {
        let pref = JSON.parse(preference.json)
        if (pref.title.includes(prefType)) {
            elem = document.createElement("div")
            elem.className = "dropdownElement";
            let kcal =  pref.protein*4+pref.fat*9+pref.carbs*4;
            elem.innerHTML = pref.title + ": " + pref.protein + "/" + pref.fat + "/" + pref.carbs + "<br>" + kcal + "kcal";
            elem.setAttribute( "onClick", "selectDishPreference('"+ JSON.stringify(pref) +"');" );
            element.appendChild(elem);
        }
    })
    element.style = "display: flex;";
}
function selectDishPreference(string) {
    debugger;
    dish = JSON.parse(string);
    if (dish.type == "gram") {
        document.getElementById("selm").value = "gram";
    } else {
        document.getElementById("selm").value = "serv"
    }
    document.getElementById("proi").value = dish.protein;
    document.getElementById("fati").value = dish.fat;
    document.getElementById("cari").value = dish.carbs;
}

async function getIncomes() {
    const response = await fetch("/incomes", {
        method: "GET",
    })
    if (response.status === 200) {
        return response.json();
    }
    else if (response.status === 204)
        return [];
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
debugger;
getIncomes().then((incomesunparsed) => {
    userIncomes = incomesunparsed;

    dateStart = new Date();
    dateEnd = new Date();
    dateStart.setHours(0,0,0,0);
    dateEnd.setHours(23,59,59,59);
    let todayIncomes = [];
    todayIncomes = selectIncomesByDate(dateStart.toISOString(), dateEnd.toISOString());

    let countProt = 0;
    let countFat = 0;
    let countCarbs = 0;
    todayIncomes.forEach(income => {
        countProt += parseFloat(income.protein);
        countFat += parseFloat(income.fat);
        countCarbs += parseFloat(income.carbs);
    })
    document.getElementById("todayProt").innerHTML = countProt + "g";
    document.getElementById("todayFat").innerHTML = countFat + "g";
    document.getElementById("todayCarbs").innerHTML = countCarbs + "g";
    getGoals().then((goals) => {
        if (goals == null) {
            document.getElementById("todayProtPercent").innerHTML = "No goal"
            document.getElementById("todayFatPercent").innerHTML = "No goal"
            document.getElementById("todayCarbsPercent").innerHTML = "No  goal"
        } else {
            goal = JSON.parse(goals.json)
            userGoals = goal;
            document.getElementById("todayProtPercent").innerHTML = (countProt/goal.protein).toFixed(2)*100 + "%"
            document.getElementById("todayFatPercent").innerHTML = (countFat/goal.fat).toFixed(2)*100 + "%"
            document.getElementById("todayCarbsPercent").innerHTML = (countCarbs/goal.carbs).toFixed(2)*100 + "%"
        }


});

});
function selectIncomesByDate(dateStart, dateEnd) {
    let res = [];
    userIncomes.forEach(income => {
        let realIncome = JSON.parse(income.json)
        if ((realIncome.date >= dateStart) && (realIncome.date <= dateEnd)) {
            res.push(realIncome);
        }
    })
    return res;
}

/////////SOMEWHAT GOOD UPPER THAN THIS
/////////SHIT UNDER THIS


async function createMeal() {
    let meal = getCraftedMeal()
    isNow = document.getElementById("nowMealButton").checked;
    let date;
    if (isNow) {
        date = new Date().toISOString().split(".")[0];
    } else {
        date = new Date(document.getElementById("dateMealLine").value);
    }
    await saveMeal(meal, date)
}


async function getResultByDate(date) {
    debugger;
    affixValue = parseInt(document.getElementById("hourBorder").value);
    //2024-03-04
    let dateStart = new Date(date);
    let dateEnd = new Date(date);
    dateStart.setHours(0+affixValue,0,0,0);
    dateEnd.setHours(23+affixValue,59,59,59);
    meals = await getMeals(dateStart.toISOString().split(".")[0], dateEnd.toISOString().split(".")[0])
    result = countMeals(meals); // <- Result object
    document.getElementById("messagesWindow").innerHTML = result.totalProtein + "/" + result.totalFat + "/" + result.totalCarbs + "/" + result.calories + "/" + result.fatPercent;
}

async function todayResult() {
    debugger;
    today = new Date();
    affixValue = parseInt(document.getElementById("hourBorder").value);
    if (today.getHours() < affixValue)
        today.setDate(today.getDate()-1);
    
    let month = String(today.getMonth() + 1);
    if (month.length == 1) {
        month = "0" + month;
    }
    let date = String(today.getDate());
    if (date.length  == 1) {
        date = "0" + date;
    }
    dateToday = today.getFullYear() + "-" + month + "-" + date;
    


    getResultByDate(dateToday)
}
async function checkAuth() {
    const response = await fetch("/auth", {
        method: "GET",
    })
    if (response.status === 200) {
        document.getElementById("messagesWindow").innerHTML = (await response.json()).username;
        loggedIn = true;
    }
}
async function getDayDivisor() {
    const response = await fetch("/daydivisors", {
        method: "GET",
    })
    if (response.status === 200) {
        return (await response.json()).daydivisor;
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function setDayDivisor(value) {
    const response = await fetch("/daydivisors", {
        method: "PUT",
        body: JSON.stringify({
            daydivisor: value
        }),
    })
    if (response.status === 200) {
        return
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function getDesires() {
    const response = await fetch("/desires", {
        method: "GET",
    })
    if (response.status === 200) {
        result = await response.json();
        reqpProtein = parseFloat(result.reqprotein);
        reqFat = parseFloat(result.reqfat);
        reqCarbs = parseFloat(result.reqcarbs);
        reqCalories = parseFloat(result.reqcalories);
        return {reqProtein, reqFat, reqCarbs, reqCalories};
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function setDesires(protein, fat, carbs, calories) {
    const response = await fetch("/desires", {
        method: "PUT",
        body: JSON.stringify({
            reqprotein: protein,
            reqfat: fat,
            reqcarbs: carbs,
            reqcalories: calories
        }),
    })
    if (response.status === 200) {
        return
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function addIngridient(protein, fat, carbs, title, id) {
    craftingMeal.push({protein, fat, carbs, title, id})
    recountMeal();
}
async function deleteIngridient(id) {
    craftingMeal = craftingMeal.filter(obj => obj.id !== id);
    recountMeal();
}
async function newIngridient() {
    debugger;
    let protein = document.getElementById("proi").value
    let fat = document.getElementById("fati").value
    let carbs = document.getElementById("cari").value
    let quantity = document.getElementById("amni").value
    let title = document.getElementById("titi").value
    if(document.getElementById("selm").value == "gram") {
        type = 1;
        if (quantity == "") {quantity = 100}
        quantity /= 100;
    } else {
        if (quantity == "") {quantity = 1}
        type = 0
    }
    protein *= quantity;
    fat *= quantity;
    carbs *= quantity;
    id = lastIngid;
    addIngridient(protein, fat, carbs, title, id);
    addToPlate(protein, fat, carbs, title, id);
    lastIngid++;
    if (document.getElementById("favI").dataset.selected == "1") {
        addFav(protein, fat, carbs, title)
    }


}
async function addToPlate(protein, fat, carbs, title, id) {
    if ((title == "") || (title == undefined))
        title = "Without name"
    elem = document.createElement("div");
    elem.style = "border: solid 2px black; border-radius: 5px; margin-bottom: 10px;"
    elem.id = id;
    elem.className = "plateElem";
    elem.innerHTML = `
    <div style='display:flex; flex-direction: row; justify-content: space-between; padding-top:10px; padding-right:10px'>
        <div style='display:flex; flex-direction: column; padding: 20px 30px 20px 30pxж'>
            <div style='display:flex; flex-direction: row; justify-content: space-between; padding-right: 10px;'>
                <span> `+title+`:</span> 
                
            </div>
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kcsal</span>
        </div>
        <img class = "buttonImg", style = "width: 60px; height:60px" src = "assets/images/delete.png" onclick = "deleteFromPlate(` + id + `)">
    </div>`;
    document.getElementById("plateBox").appendChild(elem);
    
    
    
}

function recountMeal() {
    result = getCraftedMeal();
    prot =  result.protein.toFixed(2);
    fat =  result.fat.toFixed(2);
    carbs =  result.carbs.toFixed(2);
    document.getElementById("mealstat").innerHTML =  prot + "/" + fat + "/" + carbs;
    document.getElementById("mealkkal").innerHTML = prot*4+fat*9+carbs*4 + "kcal";
    document.getElementById("mealprecent").innerHTML = ((prot/userGoals.protein)*100).toFixed(1) + "/" + ((fat/userGoals.fat)*100).toFixed(1) + "/" + ((carbs/userGoals.carbs)*100).toFixed(1) + "%"
}
checkAuth().then(() => {
if (loggedIn) {
    getDayDivisor().then((divisor) => {document.getElementById("hourBorder").value = divisor});
    getPreferences(document.getElementById("menuHider"));
}
});
function changeMealType() {
    if(document.getElementById("mealType").value == "gramm") {
        document.getElementById("mealQuantity").placeholder = "Грамм"
    } else {
        document.getElementById("mealQuantity").placeholder = "Штук"
    }

}

async function selectPreferenceOption(protein, fat, carbs, title) {
    debugger;
    document.getElementById("titleMealLine").value = title;
    document.getElementById("proteinMealLine").value = protein;
    document.getElementById("fatMealLine").value = fat;
    document.getElementById("carbsMealLine").value = carbs;
}
async function changeMenuState(force = false) {
    if (menuState || force) {
        document.getElementById("menuHider").style.display = "none";
        menuState = false
    }
    else {
        document.getElementById("menuHider").style.display = "flex";
        menuState = true
    }
}
//window.addEventListener("click", function(e){
  //  if(e.target == document.getElementById("preferenceDropdownMenu"))
    //    changeMenuState();
    //else changeMenuState(true);
//})
function select1(s) {
    document.getElementById(s).style.outline = "solid thin #000000";
}
function unfocus1(s){
    document.getElementById(s).style.outline = "0";
}
function getPart() {
    val1 = document.getElementById("parts1").value;
    if (val1 = "") val1 = "1";
    val2 = document.getElementById("parts2").value;
    if (val2 = "") val2 = "1";
    return val1/val2;
}

async function unfocusandclose(s, e){
    //TODO: REDO THIS SHIT
    await sleep(100);
    document.getElementById(s).style.outline = "0";
    document.getElementById(e).style.display = "none";
}
function focusandopen(s, e){
    showPrefs(e);
    document.getElementById(s).style.outline = "solid thin #000000";
    document.getElementById(e).style.display = "flex";
}
function selectButton(obj) {
    if (document.getElementById(obj).dataset.selected == "1") {
        document.getElementById(obj).style.background = "#D9D9D9";
        document.getElementById(obj).dataset.selected = "0";
    } else {
        document.getElementById(obj).style.background = "url(assets/images/selected.png)";
        document.getElementById(obj).dataset.selected = "1"
    }
}
function showMenu() {
    if (document.getElementById("menu").dataset.opened == "0") {
        document.getElementById("menu").style.display = "block"
        document.getElementById("menu").dataset.opened = "1"
    } else {
        document.getElementById("menu").style.display = "none"
        document.getElementById("menu").dataset.opened = "0"
    }
}
function changedMeasurement() {
    if (document.getElementById("selm").value == "serv") {
        document.getElementById("meastext").innerHTML= " - Servings";
        document.getElementById("amni").placeholder = "1";
    } else {
        document.getElementById("meastext").innerHTML= " - Grams";
        document.getElementById("amni").placeholder = "100";
    }
}
function closeExcept(openWindow) {
    modalWindows.forEach(window => { 
        if (window != openWindow)
            document.getElementById(window).style.display = "none"; 
        else document.getElementById(window).style.display = "flex";
    }
    );
}
function deleteFromPlate(id) {
    document.getElementById(id).remove();
    deleteIngridient(id);
}
async function deleteFavorites(id) {
    document.getElementById("FAVBOX_" + id).remove();
    const response = await fetch("/preferences/" + id, {
            method: "DELETE",
            headers: {
                            'Content-Type': 'application/json'
                        },
        })
    if (response.status === 200)
            return;
        throw response.status;
}
function addFav(protein, fat, carbs, title, id) {
    elem = document.createElement("div");
    elem.style = "border: solid 2px black; border-radius: 5px; margin-bottom: 10px;"
    elem.id = id;
    elem.className = "plateElem";
    elem.innerHTML = `
    <div style='display:flex; flex-direction: row; justify-content: space-between; padding-top:10px; padding-right:10px'>
        <div style='display:flex; flex-direction: column; padding: 20px 30px 20px 30pxж'>
            <div style='display:flex; flex-direction: row; justify-content: space-between; padding-right: 10px;'>
                <span> `+title+`:</span> 
                
            </div>
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kcal</span>
        </div>
        <img class = "buttonImg", style = "width: 60px; height:60px" src = "assets/images/delete.png" onclick = "deleteFromFav(FAV_` + title + `)">
    </div>`;
    document.getElementById("favBox").appendChild(elem);
}
function deleteFromFav(title) {
    document.getElementById("FAV_" + title).remove();
}