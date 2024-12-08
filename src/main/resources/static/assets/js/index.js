let loggedIn = false;
let timeOffset = new Date().getTimezoneOffset()/(-60)
let craftingMeal = []
let menuState = false;
modalWindows = ["account", "mainWindow", "menu", "plate", "favorites", "results", "goals", "settings", "info"];
let lastIngid = 0;


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
    sendRegisterRequest(login, password).then(() => registerSuccesful(login), (status) => registerFailed(login, status));
}
function registerSuccesful(login) {
    document.getElementById("messagesWindow").innerHTML = login;
}
function registerFailed(login, status) {
    document.getElementById("messagesWindow").innerHTML = status;
}
async function createPreference(protein, fat, carbs, title, type) {
    const response = await fetch("/preferences", {
        method: "POST",
        body: JSON.stringify({
            protein: protein,
            fat: fat,
            carbs: carbs,
            title: title,
            type: type})
    })
    if (response.status === 201) {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function newPreference() {
    debugger;
    protein = document.getElementById("proteinLine").value
    fat = document.getElementById("fatLine").value
    carbs = document.getElementById("carbsLine").value
    title = document.getElementById("titleLine").value
    if(document.getElementById("preferenceType").value == "gramm") {
        type = 1;
    } else {
        type = 0
    }
    createPreference(protein, fat, carbs, title, type)
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
async function createMeal() {
    debugger;
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
async function saveMeal(meal, date) {
    const response = await fetch("/incomes", {
        method: "POST",
        body: JSON.stringify({
            date: date,
            protein: meal.totalProtein,
            fat: meal.totalFat,
            carbs: meal.totalCarbs,
            title: document.getElementById("titleMealLine").value})
    })
    if (response.status === 201) {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
    else {
        document.getElementById("messagesWindow").innerHTML = response.status;
    }
}
async function getMeals(dateStart, dateEnd) {
    debugger;
    const response = await fetch("/incomes?datestart=" + dateStart + "&dateend=" + dateEnd, {
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
function countMeals(meals) {
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    meals.forEach(meal => {
        totalProtein += parseFloat(meal.protein);
        totalFat += parseFloat(meal.fat);
        totalCarbs += parseFloat(meal.carbs);
    });
    let calories = (totalProtein*4 + totalFat*9 + totalCarbs*4)
    let fatPercent = (totalFat*9)/calories
    return {totalProtein, totalFat, totalCarbs, calories, fatPercent};
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
    protein = document.getElementById("proi").value
    fat = document.getElementById("fati").value
    carbs = document.getElementById("cari").value
    quantity = document.getElementById("amni").value
    title = document.getElementById("titi").value
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
    debugger;
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
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kkal</span> 
        </div>
        <img class = "buttonImg", style = "width: 60px; height:60px" src = "assets/images/delete.png" onclick = "deleteFromPlate(` + id + `)">
    </div>`;
    document.getElementById("plateBox").appendChild(elem);
    
    
    
}
function getCraftedMeal() {
    return countMeals(craftingMeal);
}
function recountMeal() {
    result = getCraftedMeal();
    document.getElementById("mealstat").innerHTML = result.totalProtein.toFixed(2) + "/" + result.totalFat.toFixed(2) + "/" + result.totalCarbs.toFixed(2);
    document.getElementById("mealkkal").innerHTML = result.calories.toFixed(2) + "kkal";
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
async function getPreferences(element) {
    element.innerHTML = "";
    const response = await fetch("/preferences", {
        method: "GET",
    });
    if (response.status === 200) {
        preferencies = await response.json();
        preferencies.forEach(preference => {
            const newOption = document.createElement("div")
            newOption.innerHTML = preference.title + "<br>" + preference.protein + "-" + preference.fat + "-" + preference.carbs;
            newOption.value = preference.id
            newOption.setAttribute("onClick", "javascript: selectPreferenceOption('"+ preference.protein + "','" + preference.fat + "','" + preference.carbs + "','" + preference.title +"');" );
            element.appendChild(newOption);
        });
    }
    else throw response.status;
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
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kkal</span> 
        </div>
        <img class = "buttonImg", style = "width: 60px; height:60px" src = "assets/images/delete.png" onclick = "deleteFromFav(FAV_` + title + `)">
    </div>`;
    document.getElementById("favBox").appendChild(elem);
}
function deleteFromFav(title) {
    document.getElementById("FAV_" + title).remove();
}