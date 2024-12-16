let loggedIn = false;
let timeOffset = new Date().getTimezoneOffset()/(-60)
let craftingMeal = []
let menuState = false;
let userIncomes = [];
let userGoals = {protein:-1, fat:-1, carbs:-1};

modalWindows = ["account", "mainWindow", "menu", "plate", "favorites", "results", "goals"];
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
        window.location.href = "/static/login.html";
    }
    window.location.href = "/static/login.html";
}


function registerSuccessful(login) {
    document.getElementById("messagesWindow").innerHTML = login;
}
function registerFailed(login, status) {
    document.getElementById("messagesWindow").innerHTML = status;
}


async function postMeal(meal) {
    craftingMeal = [];
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
    
    userIncomes.push({id:parseInt(await response.text()), login:document.getElementById("usernameSign").innerHTML, json: mealString})
}
async function saveMeal() {
    let meal = {};

    meal.title = document.getElementById("titi").value
    if (meal.title == "") {
        meal.title = "No Title";
    };
    meal.protein = document.getElementById("proi").value;

    if (meal.protein == "") {
        meal.protein = "0";
    };
    meal.fat = document.getElementById("fati").value;

    if (meal.fat == "") {
        meal.fat = "0";
    };
    meal.carbs = document.getElementById("cari").value;

    if (meal.carbs == "") {
        meal.carbs = "0";
    };
    
    let quantity = document.getElementById("amni").value

    if(document.getElementById("selm").value == "gram") {
    if (quantity == "") {quantity = 100}
        quantity /= 100;
        let amnt = (parseFloat(meal.protein) + parseFloat(meal.fat) + parseFloat(meal.carbs));
        if (amnt > 100) {
            alert("Invalid value. Too much macronutrients");
            return;
        }
    } else {
        if (quantity == "") {quantity = 1}
    }
    document.getElementById("amni").value = "";
    document.getElementById("titi").value = "";document.getElementById("proi").value = "";document.getElementById("fati").value= "";document.getElementById("cari").value = "";

    meal.date = new Date().toISOString().split(".")[0];
    meal.type = document.getElementById("selm").value;
    meal.protein  = meal.protein*quantity;
    meal.fat = meal.fat*quantity;;
    meal.carbs = meal.carbs*quantity;
    if (document.getElementById("favI").dataset.selected == "1") {
            if (meal.title == "") {
                document.getElementById("messagesWindow").innerHTML = "Missing title";
                return;

            } else {
                postPreference(meal);
            }
    }

    postMeal(meal)
    location.reload();
}

async function saveFullPlate() {
    let meal = getCraftedMeal();
    craftingMeal = [];
    recountMeal();
    meal.title = document.getElementById("titlePlate").value;
    meal.date = new Date().toISOString().split(".")[0];
    document.getElementById("titlePlate").value = "";
    if (meal.title == "")
        meal.title = "No Title";
    postMeal(meal);
    if (document.getElementById("favD").dataset.selected == "1") {
        postPreference(meal);
    location.reload();
    }
}
async function savePlate() {

    let meal = getCraftedMeal();
    meal.protein = meal.protein/getPart();
    meal.fat = meal.fat/getPart();
    meal.carbs = meal.carbs/getPart();
    meal.title = document.getElementById("plateTitle2").value;
    meal.date = new Date().toISOString().split(".")[0];
        if (meal.title == "")
            meal.title = "No Title";
    postMeal(meal);
    if (document.getElementById("favP").dataset.selected == "1") {
        postPreference(meal);
    }
    location.reload();
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
                finalMeal[key] += parseFloat(meal[key]);
            } else {
                finalMeal[key] = parseFloat(meal[key]);
            }
        });
    });
    if (finalMeal.protein == undefined)
        finalMeal.protein = 0;
    if (finalMeal.fat == undefined)
        finalMeal.fat = 0;
    if (finalMeal.carbs == undefined)
        finalMeal.carbs = 0;
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







function showPrefs(elemento, sorter, target) {
    
    element = document.getElementById(elemento);
    element.innerHTML = "";
    let prefType = "";
    if (document.getElementById(sorter) != null)
        prefType = document.getElementById(sorter).value;
    preferences.forEach(preference => {
        let pref = JSON.parse(preference.json)
        if (pref.title.includes(prefType)) {
            elem = document.createElement("div")
            elem.className = "dropdownElement";
            elem.style ="border: solid 1px black; width:100%"
            let kcal =  (pref.protein*4+pref.fat*9+pref.carbs*4).toFixed(2);
            elem.innerHTML = pref.title + ": " + pref.protein + "/" + pref.fat + "/" + pref.carbs + "<br>" + kcal + "kcal";
            if (target != null)
                elem.setAttribute( "onClick", "craftingMeal = []; selectPlatePreference('"+ JSON.stringify(pref) +"'); manageClick('null', '"+ elemento + "', 'notnull')" );
            else elem.setAttribute( "onClick", "selectDishPreference('"+ JSON.stringify(pref) +"');manageClick('null', '"+ elemento + "', 'null')" );
            element.appendChild(elem);
        }
    })
    database.forEach(preference => {
        if (preference.protein == undefined) preference.protein = "0";
        if (preference.fat == undefined) preference.fat = "0";
        if (preference.carbs == undefined) preference.carbs = "0";
        let pref = preference;
        if (pref.title.includes(prefType)) {
            elem = document.createElement("div")
            elem.className = "dropdownElement";
            elem.style ="border: solid 1px black;"
            let kcal =  (pref.protein*4+pref.fat*9+pref.carbs*4).toFixed(2);
            pref.protein = "" + pref.protein;
            pref.fat = "" + pref.fat;
            pref.carbs = "" + pref.carbs;
            elem.innerHTML = pref.title + ": " + pref.protein + "/" + pref.fat + "/" + pref.carbs + "<br>" + kcal + "kcal";
            if (target != null)
                elem.setAttribute( "onClick", "craftingMeal = []; selectPlatePreference('"+ JSON.stringify(pref) +"'); manageClick('null', '"+ elemento + "', 'notnull')" );
            else elem.setAttribute( "onClick", "selectDishPreference('"+ JSON.stringify(pref) +"');manageClick('null', '"+ elemento + "', 'null')" );
            element.appendChild(elem);
        }
    })
    element.style = "display: flex;";
}
function selectDishPreference(string) {
    
    dish = JSON.parse(string);
    if (dish.type == "gram") {
        document.getElementById("selm").value = "gram";
    } else {
        document.getElementById("selm").value = "serv"
    }
    document.getElementById("titi").value = dish.title;
    document.getElementById("proi").value = dish.protein;
    document.getElementById("fati").value = dish.fat;
    document.getElementById("cari").value = dish.carbs;
}

function selectPlatePreference(string) {
    
    document.getElementById("plateBox").innerHTML = "";

    dish = JSON.parse(string);
    id = lastIngid;
    protein = dish.protein;
    fat = dish.fat;
    carbs = dish.carbs;
    title = dish.title;
    addIngridient(protein, fat, carbs, title, id);
    addToPlate(protein, fat, carbs, title, id);
    lastIngid++;
    document.getElementById("titlePlate").value = title;
    document.getElementById("plateTitle2").value = title;
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

function countGoals() {
    massS = document.getElementById("mass").value;
    if (parseFloat(massS) <= 10 || parseFloat(massS) >= 500) {
            alert("invalid value of mass")
            return;
        }
    ageS = document.getElementById("age").value;
    if (parseFloat(ageS) <= 13 || parseFloat(ageS) >= 99) {
            alert("invalid value age")
            return;
        }
    heiS = document.getElementById("height").value;
    if (parseFloat(heiS) <= 80 || parseFloat(heiS) >= 250) {
            alert("invalid value of height")
            return;
        }
    if (massS == "") massS = 70;
    if (ageS == "") ageS = 18;
    if (heiS == "") heiS = 175;
    mass = parseFloat(massS);
    age = parseFloat(ageS);
    height = parseFloat(heiS);
    sex = document.getElementById("sex").value;
    activity = parseFloat(document.getElementById("activity").value);
    if (sex == "male") {
        return (10*mass + 6.25*height - 5*age + 5)*activity;
    } else {
        return (10*mass + 6.25*height - 5*age - 161)*activity;
    }
}

function goalsM() {
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
            if (income.protein == "") income.protein = "0";
            if (income.fat == "") income.fat = "0";
            if (income.carbs == "") income.carbs = "0";
            countProt += parseFloat(income.protein);
            countFat += parseFloat(income.fat);
            countCarbs += parseFloat(income.carbs);

        })

        dateStart = new Date();
        dateStart.setDate(dateStart.getDate() - 8);
        dateEnd = new Date();
        dateEnd.setDate(dateEnd.getDate() - 1);
        let weeklyIncomes = [];
        weeklyIncomes = selectIncomesByDate(dateStart.toISOString(), dateEnd.toISOString());

        let countProtw = 0;
        let countFatw = 0;
        let countCarbsw = 0;
        weeklyIncomes.forEach(income => {
            if (income.protein == "") income.protein = "0";
            if (income.fat == "") income.fat = "0";
            if (income.carbs == "") income.carbs = "0";
            countProtw += parseFloat(income.protein);
            countFatw += parseFloat(income.fat);
            countCarbsw += parseFloat(income.carbs);
        })

        dateStart = new Date();
        dateStart.setDate(dateStart.getDate() - 31);
        dateEnd = new Date();
        dateEnd.setDate(dateEnd.getDate() - 1);
        let monthlyIncomes = [];
        monthlyIncomes = selectIncomesByDate(dateStart.toISOString(), dateEnd.toISOString());

        let countProtm = 0;
        let countFatm = 0;
        let countCarbsm = 0;
        weeklyIncomes.forEach(income => {
            countProtm += parseFloat(income.protein);
            countFatm += parseFloat(income.fat);
            countCarbsm += parseFloat(income.carbs);
        })




        document.getElementById("todayProt").innerHTML = countProt + "g";
        document.getElementById("todayFat").innerHTML = countFat + "g";
        document.getElementById("todayCarbs").innerHTML = countCarbs + "g";

        document.getElementById("weekdata").innerHTML = (countProtw/7).toFixed(1) + "/"+ (countFatw/7).toFixed(1) + "/" + (countCarbsw/7).toFixed(1);
        document.getElementById("monthdata").innerHTML = (countProtm/30).toFixed(1) + "/"+ (countFatm/30).toFixed(1) + "/" + (countCarbsm/30).toFixed(1);

        getGoals().then((goals) => rebuildGoals(goals));

        function rebuildGoals(goals) {
            
                if (goals == null) {
                    document.getElementById("todayProtPercent").innerHTML = "No goal"
                    document.getElementById("todayFatPercent").innerHTML = "No goal"
                    document.getElementById("todayCarbsPercent").innerHTML = "No goal"
                    document.getElementById("goalsDiv").innerHTML = "No goal"
                } else {
                    goal = JSON.parse(goals.json)
                    userGoals = goal;
                    document.getElementById("todayProtPercent").innerHTML = ((countProt/goal.protein)*100).toFixed(1) + "%"
                    document.getElementById("todayFatPercent").innerHTML = ((countFat/goal.fat)*100).toFixed(1) + "%"
                    document.getElementById("todayCarbsPercent").innerHTML = ((countCarbs/goal.carbs)*100).toFixed(1) + "%"
                    document.getElementById("goalsDiv").innerHTML = "p " + goal.protein.toFixed(1) + "|" + "f " + goal.fat.toFixed(1) + "|" + "c " + goal.carbs.toFixed(1) + "<br>" + (goal.protein*4 + goal.fat*9 + goal.carbs*4).toFixed(1)  + " kkcal";

                    document.getElementById("weekdata2").innerHTML = ((countProtw/(goal.protein*7))*100).toFixed(1) + "/"+ ((countFatw/(goal.fat*7))*100).toFixed(1) + "/" + ((countCarbsw/(goal.carbs*7))*100).toFixed(1) + "%";
                    document.getElementById("monthdata2").innerHTML = ((countProtm/(goal.protein*30))*100).toFixed(1) + "/"+ ((countFatm/(goal.fat*30))*100).toFixed(1) + "/" + ((countCarbsm/(goal.carbs*30))*100).toFixed(1) + "%";


                }
        }



    });
}


async function addToDate(protein, fat, carbs, title, id) {
    if ((title == "") || (title == undefined))
        title = "Without name"
    elem = document.createElement("div");
    elem.style = "border: solid 2px black; border-radius: 5px; margin-bottom: 10px;"
    elem.id = "DATE_" + id;
    elem.className = "plateElem";
    elem.innerHTML = `
    <div style='display:flex; flex-direction: row; justify-content: space-between; padding-top:10px; padding-right:10px'>
        <div style='display:flex; flex-direction: column; padding: 20px 30px 20px 30pxж'>
            <div style='display:flex; flex-direction: row; justify-content: space-between; padding-right: 10px;'>
                <span> `+title+`:</span>

            </div>
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kcal</span>
        </div>
        <img class = "buttonImg", style = "width: 60px; height:60px" src = "assets/images/delete.png" onclick = "deleteFromDate('` + id + `')">
    </div>`;
    document.getElementById("dateBox").appendChild(elem);
}
async function addToDatev2(protein, fat, carbs, title, id) {
    if ((title == "") || (title == undefined))
        title = "Without name"
    elem = document.createElement("div");
    elem.style = "border: solid 2px black; border-radius: 5px; margin-bottom: 10px;"
    elem.id = "DATE_" + id;
    elem.className = "plateElem";
    elem.innerHTML = `
    <div style='display:flex; flex-direction: row; justify-content: space-between; padding-top:10px; padding-right:10px'>
        <div style='display:flex; flex-direction: column; padding: 20px 30px 20px 30pxж'>
            <div style='display:flex; flex-direction: row; justify-content: space-between; padding-right: 10px;'>
                <span> `+title+`:</span>

            </div>
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kcal</span>
        </div>
    </div>`;
    document.getElementById("dateBox").appendChild(elem);
}



function dateSelected() {
    
    document.getElementById("dateBox").innerHTML = "";
    let date = document.getElementById("resultDate").value;
    todayDate = new Date();
    dateStart = new Date(date);
    dateEnd = new Date(date);
    dateStart.setHours(0,0,0,0);
    dateEnd.setHours(23,59,59,59);
    let dateIncomes = [];
    dateIncomes = selectIncomesByDate(dateStart.toISOString(), dateEnd.toISOString());
    let totalMeal = {protein:0, fat:0, carbs:0}
    if(dateStart.setHours(0,0,0,0) == todayDate.setHours(0,0,0,0)) {
        dateIncomes.forEach(realIncome => {
            totalMeal.protein += parseFloat(realIncome.protein),
            totalMeal.fat += parseFloat(realIncome.fat),
            totalMeal.carbs += parseFloat(realIncome.carbs),
            addToDate(realIncome.protein, realIncome.fat, realIncome.carbs, realIncome.title, realIncome.id)
        })
    } else {
        dateIncomes.forEach(realIncome => {
                    totalMeal.protein += parseFloat(realIncome.protein),
                    totalMeal.fat += parseFloat(realIncome.fat),
                    totalMeal.carbs += parseFloat(realIncome.carbs),
                addToDatev2(realIncome.protein, realIncome.fat, realIncome.carbs, realIncome.title, realIncome.id)
            })
    }
    document.getElementById("dateres").innerHTML = totalMeal.protein.toFixed(1) + "/" + totalMeal.fat.toFixed(1) + "/" + totalMeal.carbs.toFixed(1) + "  " + (totalMeal.protein*4 + totalMeal.fat*9 + totalMeal.carbs*4).toFixed(1) + "kcal";
}

async function recountGoals() {
    let kcal = countGoals();
    let protein;
    let fat;
    let carbs;
    let mass = document.getElementById("mass").value;
    if (mass == "") mass = '70';

    let desire = document.getElementById("desire").value;
    if (desire == "gain") {
        kcal += parseFloat(mass)*2;
        fat = (kcal*0.25)/9;
        protein = parseFloat(mass)*1.8;
        carbs = (kcal - fat*9 - protein*4)/4
    } else if (desire == "keep") {
        fat = (kcal*0.3)/9;
        protein = parseFloat(mass)*1;
        carbs = (kcal - fat*9 - protein*4)/4
    } else  {
        kcal -= parseFloat(mass)*2;
        fat = (kcal*0.2)/9;
        protein = parseFloat(mass)*1.2;
        carbs = (kcal - fat*9 - protein*4)/4
    }

    const goals = {protein:protein, fat:fat, carbs:carbs}
    const goalString = JSON.stringify(goals);
    const response = await fetch("/goals", {
        method: "POST",
        headers: {
                        'Content-Type': 'application/json'
                    },
        body: JSON.stringify({
            json: goalString
        })
    });
    goalsM();
}


goalsM();
function selectIncomesByDate(dateStart, dateEnd) {
    let res = [];
    userIncomes.forEach(income => {
        let realIncome = JSON.parse(income.json)
        if ((realIncome.date >= dateStart) && (realIncome.date <= dateEnd)) {
        realIncome.id = income.id;
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
    if (response.redirected) {
        window.location.href = response.url;
    } else if (response.status === 200) {
        loggedIn = true;
        document.getElementById("usernameSign").innerHTML = (await response.text());
    } else {
        window.location.href = "/static/login.html";
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
async function deleteIncome(id) {
     const response = await fetch("/incomes/" + id, {
            method: "DELETE",
        })
        if (response.status === 200) {
            return
        }
        else {
            document.getElementById("messagesWindow").innerHTML = response.status;
        }
}
async function newIngridient() {
    
    let protein = document.getElementById("proi").value;
    if (protein == "") protein = "0";

    let fat = document.getElementById("fati").value
    if (fat == "") fat = "0";

    let carbs = document.getElementById("cari").value
    if (carbs == "") carbs = "0";

    let quantity = document.getElementById("amni").value

    let title = document.getElementById("titi").value;

    if(document.getElementById("selm").value == "gram") {
        type = 1;
        if (quantity == "") {quantity = 100}
        if ((parseFloat(protein) + parseFloat(fat) + parseFloat(carbs)) > 100) {
            alert("Invalid value. Too much macronutrients");
            return;
        }
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
    document.getElementById("cari").value = "";
        document.getElementById("proi").value = "";
        document.getElementById("fati").value = "";
document.getElementById("amni").value = "";
    document.getElementById("titi").value = "";
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
            <span>`+protein+`/`+fat+`/`+carbs+` - ` + (protein*4+fat*9+carbs*4)+`kcal</span>
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
    document.getElementById("mealkkal").innerHTML = (prot*4+fat*9+carbs*4).toFixed(1) + "kcal";
    if (userGoals.protein != "-1")
        document.getElementById("mealprecent").innerHTML = ((prot/userGoals.protein)*100).toFixed(1) + "/" + ((fat/userGoals.fat)*100).toFixed(1) + "/" + ((carbs/userGoals.carbs)*100).toFixed(1) + "%"
}
checkAuth();
function changeMealType() {
    if(document.getElementById("mealType").value == "gramm") {
        document.getElementById("mealQuantity").placeholder = "Грамм"
    } else {
        document.getElementById("mealQuantity").placeholder = "Штук"
    }

}

async function selectPreferenceOption(protein, fat, carbs, title) {
    
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
    if (val1 == "") val1 = "1";
    val2 = document.getElementById("parts2").value;
    if (val2 == "") val2 = "1";
    return parseFloat(val1)/parseFloat(val2);
}

async function unfocusandclose(s, e, type){
    if (s == "null") {
        document.getElementById(e).style.display = "none";
        return;
    }
    document.getElementById(e).style.display = "none";
    document.getElementById(s).blur()
    document.getElementById(s).style.outline = "0";

}
function focusandopen(s, e, type){
    showPrefs(e, s, type);
    document.getElementById(s).style.outline = "solid thin #000000";
    document.getElementById(e).style.display = "flex";
}

function manageClick(s, e, type) {
    
    let elem = document.getElementById(e);
    if (elem.dataset.opened == "1") {
        unfocusandclose(s, e, type);
        elem.dataset.opened = "0";
    } else {
        focusandopen(s, e, type);
        elem.dataset.opened = "1";
    }
}
function forceClose() {
    e1 = document.getElementById("dropdownTitleDish");
    e2 = document.getElementById("dropdownTitleDish2");
    e3 = document.getElementById("dropdownTitleDish3");
    e1.dataset.opened = "0";
    e2.dataset.opened = "0";
    e3.dataset.opened = "0";
    e1.style.display = "none";
    e2.style.display = "none";
    e3.style.display = "none";
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
    forceClose();
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
function deleteFromDate(id) {
    document.getElementById("DATE_" + id).remove();
    deleteIncome(id);
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

    if (response.status === 200) {
        getPrefs().then(() => {rebuildFavs()});
        return;
    }

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
/*

let res = [];
smth.FoundationFoods.forEach(food => {
name = food.description
    let currfood = {name: name}
    food.foodNutrients.forEach(nutrient => {
        if (nutrient.nutrient.name == "Protein") {
            currfood.protein = nutrient.amount
        }
        if (nutrient.nutrient.name == "Carbohydrate, by difference") {
            currfood.carbs = nutrient.amount
        }
        if (nutrient.nutrient.name == "Total lipid (fat)") {
            currfood.fat = nutrient.amount
        } if (nutrient.nutrient.name == "Total fat (NLEA)") {
            currfood.fat = nutrient.amount
        }


    })
    res.push(currfood);
})

let ress = JSON.stringify(res);
console.log(ress);


sourceFood = [{"name":"Hummus, commercial","protein":7.35,"fat":16.1,"carbs":14.9},{"name":"Tomatoes, grape, raw","fat":0.63,"protein":0.83,"carbs":5.51},{"name":"Beans, snap, green, canned, regular pack, drained solids","fat":0.39,"carbs":4.11,"protein":1.04},{"name":"Frankfurter, beef, unheated","fat":26,"carbs":2.89,"protein":11.7},{"name":"Nuts, almonds, dry roasted, with salt added","fat":53.4,"carbs":16.2,"protein":20.4},{"name":"Kale, raw","protein":2.92,"fat":1.49,"carbs":4.42},{"name":"Egg, whole, raw, frozen, pasteurized","protein":12.3,"fat":10.3,"carbs":0.91},{"name":"Egg, white, raw, frozen, pasteurized","fat":0.16,"carbs":0.74,"protein":10.1},{"name":"Egg, white, dried","protein":79.9,"fat":0.65,"carbs":6.02},{"name":"Onion rings, breaded, par fried, frozen, prepared, heated in oven","fat":12.6,"carbs":36.3,"protein":4.52},{"name":"Pickles, cucumber, dill or kosher dill","fat":0.43,"carbs":1.99,"protein":0.48},{"name":"Cheese, parmesan, grated","fat":24,"carbs":12.4,"protein":29.6},{"name":"Cheese, pasteurized process, American, vitamin D fortified","protein":18,"fat":27.6,"carbs":5.27},{"name":"Grapefruit juice, white, canned or bottled, unsweetened","protein":0.55,"fat":0.7,"carbs":7.59},{"name":"Peaches, yellow, raw","carbs":10.1,"protein":0.91,"fat":0.27},{"name":"Seeds, sunflower seed kernels, dry roasted, with salt added","fat":52.1,"carbs":17.1,"protein":21},{"name":"Bread, white, commercially prepared","fat":3.45,"carbs":49.2,"protein":9.43},{"name":"Kale, frozen, cooked, boiled, drained, without salt","fat":1.21,"carbs":5.3,"protein":2.94},{"name":"Mustard, prepared, yellow","protein":4.25,"fat":3.76,"carbs":5.3},{"name":"Kiwifruit, green, raw","fat":0.44,"protein":1.06,"carbs":14},{"name":"Nectarines, raw","carbs":9.18,"fat":0.13,"protein":1.06},{"name":"Cheese, cheddar","carbs":2.44,"protein":23.3,"fat":29},{"name":"Cheese, cottage, lowfat, 2% milkfat","fat":1.87,"carbs":4.31,"protein":11},{"name":"Cheese, mozzarella, low moisture, part-skim","protein":23.7,"fat":17.8,"carbs":4.44},{"name":"Egg, whole, dried","protein":48.1,"fat":39.8,"carbs":1.87},{"name":"Egg, yolk, raw, frozen, pasteurized","fat":25.1,"carbs":0.59,"protein":15.6},{"name":"Egg, yolk, dried","fat":55.5,"carbs":1.07,"protein":34.2},{"name":"Yogurt, Greek, plain, nonfat","protein":10.3,"fat":0.17,"carbs":3.64},{"name":"Yogurt, Greek, strawberry, nonfat","fat":0.15,"carbs":12.2,"protein":8.06},{"name":"Oil, coconut","protein":0,"fat":90.5,"carbs":0.84},{"name":"Chicken, broilers or fryers, drumstick, meat only, cooked, braised","protein":23.9,"fat":5.23,"carbs":0},{"name":"Chicken, broiler or fryers, breast, skinless, boneless, meat only, cooked, braised","fat":3.05,"carbs":0,"protein":32.1},{"name":"Sauce, pasta, spaghetti/marinara, ready-to-serve","fat":1.05,"carbs":8.05,"protein":1.41},{"name":"Ham, sliced, pre-packaged, deli meat (96%fat free, water added)","protein":16.7,"fat":3.15,"carbs":0.27},{"name":"Olives, green, Manzanilla, stuffed with pimiento","fat":11.8,"protein":1.15,"carbs":4.96},{"name":"Cookies, oatmeal, soft, with raisins","fat":13.7,"protein":5.79,"carbs":69.6},{"name":"Tomatoes, canned, red, ripe, diced","fat":0.5,"protein":0.84,"carbs":3.32},{"name":"Fish, haddock, raw","fat":0.32,"protein":16.3,"carbs":0},{"name":"Fish, pollock, raw","fat":0.4,"protein":12.3,"carbs":0},{"name":"Fish, tuna, light, canned in water, drained solids","fat":0.6,"protein":19,"carbs":0.08},{"name":"Restaurant, Chinese, fried rice, without meat","fat":2.22,"carbs":32.5,"protein":3.84},{"name":"Restaurant, Latino, tamale, pork","protein":7.38,"fat":7.98,"carbs":15.8},{"name":"Restaurant, Latino, pupusas con frijoles (pupusas, bean)","protein":5.59,"fat":8.08,"carbs":31.5},{"name":"Bread, whole-wheat, commercially prepared","fat":2.98,"carbs":43.1,"protein":12.3},{"name":"Beef, loin, tenderloin roast, separable lean only, boneless, trimmed to 0\" fat, select, cooked, roasted","fat":5.56,"carbs":0,"protein":27.7},{"name":"Beef, loin, top loin steak, boneless, lip-on, separable lean only, trimmed to 1/8\" fat, choice, raw","fat":5.93,"carbs":0,"protein":22.8},{"name":"Beef, round, eye of round roast, boneless, separable lean only, trimmed to 0\" fat, select, raw","protein":23.4,"fat":2.23,"carbs":0},{"name":"Beef, round, top round roast, boneless, separable lean only, trimmed to 0\" fat, select, raw","fat":2.14,"carbs":0,"protein":23.7},{"name":"Beef, short loin, porterhouse steak, separable lean only, trimmed to 1/8\" fat, select, raw","fat":4.5,"protein":22.7,"carbs":0},{"name":"Beef, short loin, t-bone steak, bone-in, separable lean only, trimmed to 1/8\" fat, choice, cooked, grilled","protein":27.3,"fat":10.5,"carbs":0},{"name":"Carrots, frozen, unprepared","fat":0.33,"protein":0.81,"carbs":7.92},{"name":"Cheese, dry white, queso seco","protein":24.5,"fat":21.4,"carbs":2.07},{"name":"Cheese, ricotta, whole milk","protein":7.81,"fat":10.3,"carbs":6.86},{"name":"Cheese, swiss","fat":27.6,"carbs":1.44,"protein":27},{"name":"Figs, dried, uncooked","carbs":63.9,"protein":3.3,"fat":0.92},{"name":"Lettuce, cos or romaine, raw","carbs":3.24,"fat":0.26,"protein":1.24},{"name":"Melons, cantaloupe, raw","carbs":8.16,"protein":0.82,"fat":0.18},{"name":"Oranges, raw, navels","protein":0.91,"fat":0.15,"carbs":11.8},{"name":"Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D","protein":3.38,"fat":0.85,"carbs":5.18},{"name":"Pears, raw, bartlett","protein":0.38,"fat":0.16,"carbs":15.1},{"name":"Restaurant, Chinese, sweet and sour pork","protein":8.88,"fat":13.3,"carbs":25.5},{"name":"Salt, table, iodized"},{"name":"Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)","fat":0.07,"protein":3.43,"carbs":4.92},{"name":"Sauce, salsa, ready-to-serve","protein":1.44,"carbs":6.74,"fat":0.19},{"name":"Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D","protein":3.36,"carbs":4.9,"fat":1.64},{"name":"Sausage, breakfast sausage, beef, pre-cooked, unprepared","fat":27.1,"carbs":3.37,"protein":13.3},{"name":"Sausage, Italian, pork, mild, cooked, pan-fried","fat":25.8,"carbs":2.15,"protein":18.2},{"name":"Sausage, pork, chorizo, link or ground, cooked, pan-fried","fat":26,"protein":19.3,"carbs":2.63},{"name":"Milk, whole, 3.25% milkfat, with added vitamin D","fat":2.77,"carbs":4.63,"protein":3.27},{"name":"Sausage, turkey, breakfast links, mild, raw","protein":16.7,"fat":8.86,"carbs":0.93},{"name":"Sugars, granulated","protein":0,"fat":0.32,"carbs":99.6},{"name":"Turkey, ground, 93% lean, 7% fat, pan-broiled crumbles","fat":10.4,"protein":27.1,"carbs":0},{"name":"Ham, sliced, restaurant","fat":3.54,"protein":19.6,"carbs":2.36},{"name":"Cheese, American, restaurant","fat":26.6,"protein":17.5,"carbs":6.35},{"name":"Beans, Dry, Medium Red (0% moisture)","protein":25.5,"fat":1.04},{"name":"Beans, Dry, Red (0% moisture)","protein":21.3,"fat":1.16},{"name":"Beans, Dry, Flor de Mayo (0% moisture)","protein":23.3,"fat":0.86},{"name":"Beans, Dry, Brown (0% moisture)","protein":25.6,"fat":1.12},{"name":"Beans, Dry, Tan (0% moisture)","protein":26.8,"fat":1.14},{"name":"Beans, Dry, Light Tan (0% moisture)","protein":24.6,"fat":1.28},{"name":"Beans, Dry, Carioca (0% moisture)","protein":25.2,"fat":1.44},{"name":"Beans, Dry, Cranberry (0% moisture)","protein":24.4,"fat":1.23},{"name":"Beans, Dry, Light Red Kidney (0% moisture)","protein":25,"fat":1.03},{"name":"Beans, Dry, Pink (0% moisture)","protein":23.4,"fat":1.2},{"name":"Beans, Dry, Dark Red Kidney (0% moisture)","protein":25.9,"fat":1.31},{"name":"Beans, Dry, Navy (0% moisture)","protein":24.1,"fat":1.51},{"name":"Beans, Dry, Small White (0% moisture)","protein":24.5,"fat":1.32},{"name":"Beans, Dry, Small Red (0% moisture)","protein":23.5,"fat":1.28},{"name":"Beans, Dry, Black (0% moisture)","protein":24.4,"fat":1.45},{"name":"Beans, Dry, Pinto (0% moisture)","protein":23.7,"fat":1.24},{"name":"Beans, Dry, Great Northern (0% moisture)","protein":24.7,"fat":1.24},{"name":"Broccoli, raw","carbs":6.27,"fat":0.07,"protein":2.57},{"name":"Ketchup, restaurant","fat":0.55,"protein":1.11,"carbs":26.8},{"name":"Eggs, Grade A, Large, egg white","protein":10.7,"fat":0,"carbs":2.36},{"name":"Eggs, Grade A, Large, egg yolk","fat":28.8,"protein":16.2,"carbs":1.02},{"name":"Oil, canola","fat":94.5},{"name":"Oil, corn","fat":94},{"name":"Oil, soybean","fat":94.6},{"name":"Oil, olive, extra virgin","fat":93.7},{"name":"Eggs, Grade A, Large, egg whole","protein":12.4,"fat":8.65,"carbs":0.96},{"name":"Pork, cured, bacon, cooked, restaurant","fat":34.6,"protein":40.9,"carbs":2.1},{"name":"Butter, stick, unsalted","fat":81.5},{"name":"Flour, wheat, all-purpose, enriched, bleached","protein":10.9,"fat":1.48,"carbs":77.3},{"name":"Flour, wheat, all-purpose, enriched, unbleached","fat":1.48,"carbs":73.2,"protein":13.1},{"name":"Flour, wheat, all-purpose, unenriched, unbleached","fat":1.7,"carbs":74.6,"protein":12},{"name":"Flour, whole wheat, unenriched","fat":2.73,"carbs":71.2,"protein":15.1},{"name":"Flour, bread, white, enriched, unbleached","protein":14.3,"fat":1.65,"carbs":72.8},{"name":"Flour, rice, white, unenriched","fat":1.3,"carbs":79.8,"protein":6.94},{"name":"Flour, corn, yellow, fine meal, enriched","fat":1.74,"protein":6.2,"carbs":80.8},{"name":"Butter, stick, salted","fat":65},{"name":"Onions, red, raw","protein":0.94,"fat":0.1,"carbs":9.93},{"name":"Onions, yellow, raw","protein":0.83,"fat":0.05,"carbs":8.61},{"name":"Garlic, raw","fat":0.38,"protein":6.62,"carbs":28.2},{"name":"Flour, soy, defatted","fat":3.33,"carbs":32.9,"protein":51.1},{"name":"Flour, soy, full-fat","carbs":27.9,"protein":38.6,"fat":20.7},{"name":"Flour, rice, brown","protein":7.19,"fat":3.85,"carbs":75.5},{"name":"Flour, rice, glutinous","fat":1.16,"protein":6.69,"carbs":80.1},{"name":"Flour, pastry, unenriched, unbleached","fat":1.64,"protein":8.75,"carbs":77.2},{"name":"Onions, white, raw","fat":0.13,"protein":0.89,"carbs":7.68},{"name":"Bananas, overripe, raw","fat":0.22,"protein":0.73,"carbs":20.1},{"name":"Bananas, ripe and slightly ripe, raw","carbs":23,"protein":0.74,"fat":0.29},{"name":"Apples, red delicious, with skin, raw","fat":0.212,"protein":0.188,"carbs":14.8},{"name":"Apples, fuji, with skin, raw","fat":0.162,"protein":0.148,"carbs":15.7},{"name":"Apples, gala, with skin, raw","fat":0.15,"protein":0.133,"carbs":14.8},{"name":"Apples, granny smith, with skin, raw","fat":0.138,"protein":0.266,"carbs":14.1},{"name":"Apples, honeycrisp, with skin, raw","fat":0.1,"protein":0.102,"carbs":14.7},{"name":"Oil, peanut","fat":93.4},{"name":"Oil, sunflower","fat":93.2},{"name":"Oil, safflower","fat":93.2},{"name":"Oil, olive, extra light","fat":92.9},{"name":"Mushroom, lion's mane","fat":0.256,"protein":2.5,"carbs":7.59},{"name":"Mushroom, oyster","fat":0.188,"protein":2.9,"carbs":6.94},{"name":"Mushrooms, shiitake","fat":0.195,"protein":2.41,"carbs":8.17},{"name":"Mushrooms, white button","fat":0.371,"protein":2.89,"carbs":4.08},{"name":"Soy milk, unsweetened, plain, shelf stable","fat":1.88,"protein":3.55,"carbs":1.29},{"name":"Almond milk, unsweetened, plain, shelf stable","fat":1.11,"protein":0.555,"carbs":0.337},{"name":"Spinach, baby","fat":0.619,"protein":2.85,"carbs":2.41},{"name":"Spinach, mature","fat":0.604,"protein":2.91,"carbs":2.64},{"name":"Tomato, roma","fat":0.425,"protein":0.696,"carbs":3.84},{"name":"Flour, 00","fat":1.52,"protein":11.4,"carbs":74.4},{"name":"Flour, spelt, whole grain","fat":2.54,"protein":14.5,"carbs":70.7},{"name":"Flour, semolina, coarse and semi-coarse","fat":1.6,"protein":11.7,"carbs":73.8},{"name":"Flour, semolina, fine","fat":1.84,"protein":13.3,"carbs":72},{"name":"Apple juice, with added vitamin C, from concentrate, shelf stable","fat":0.286,"protein":0.086,"carbs":11.4},{"name":"Orange juice, no pulp, not fortified, from concentrate, refrigerated","fat":0.325,"protein":0.734,"carbs":10.3},{"name":"Grape juice, purple, with added vitamin C, from concentrate, shelf stable","fat":0.288,"protein":0.258,"carbs":15.6},{"name":"Grape juice, white, with added vitamin C, from concentrate, shelf stable","fat":0.265,"protein":0.094,"carbs":15.8},{"name":"Cranberry juice, not fortified, from concentrate, shelf stable","fat":0.338,"protein":0,"carbs":7.26},{"name":"Grapefruit juice, red, not fortified, not from concentrate, refrigerated","fat":0.267,"protein":0.57,"carbs":9.1},{"name":"Tomato juice, with added ingredients, from concentrate, shelf stable","fat":0.288,"protein":0.859,"carbs":4.32},{"name":"Orange juice, no pulp, not fortified, not from concentrate, refrigerated","fat":0.356,"protein":0.812,"carbs":10},{"name":"Mushroom, portabella","fat":0.312,"protein":2.75,"carbs":4.66},{"name":"Mushroom, king oyster","fat":0.308,"protein":2.41,"carbs":8.5},{"name":"Mushroom, enoki","fat":0.245,"protein":2.42,"carbs":8.14},{"name":"Mushroom, crimini","fat":0.197,"protein":3.09,"carbs":4.01},{"name":"Mushroom, maitake","fat":0.265,"protein":2.2,"carbs":6.6},{"name":"Mushroom, beech","fat":0.449,"protein":2.18,"carbs":6.76},{"name":"Mushroom, pioppini","fat":0.24,"protein":3.5,"carbs":5.76},{"name":"Soy milk, sweetened, plain, refrigerated","fat":1.96,"protein":2.78,"carbs":3},{"name":"Almond milk, unsweetened, plain, refrigerated","fat":1.56,"protein":0.656,"carbs":0.671},{"name":"Oat milk, unsweetened, plain, refrigerated","fat":2.75,"protein":0.797,"carbs":5.1},{"name":"Carrots, mature, raw","fat":0.351,"protein":0.941,"carbs":10.3},{"name":"Carrots, baby, raw","fat":0.138,"protein":0.805,"carbs":9.08},{"name":"Peppers, bell, green, raw","fat":0.106,"protein":0.715,"carbs":4.78},{"name":"Peppers, bell, yellow, raw","fat":0.121,"carbs":6.6,"protein":0.819},{"name":"Peppers, bell, red, raw","fat":0.126,"carbs":6.65,"protein":0.896},{"name":"Peppers, bell, orange, raw","fat":0.156,"protein":0.882,"carbs":6.7},{"name":"Buttermilk, low fat","fat":1.08,"protein":3.46,"carbs":4.81},{"name":"Yogurt, plain, whole milk","fat":4.48,"carbs":5.57,"protein":3.82},{"name":"Yogurt, Greek, plain, whole milk","fat":4.39,"carbs":4.75,"protein":8.78},{"name":"Cheese, parmesan, grated, refrigerated","fat":29.5,"carbs":4.33,"protein":30.1},{"name":"Cheese, feta, whole milk, crumbled","fat":19.1,"carbs":5.58,"protein":19.7},{"name":"Flour, almond","fat":50.2,"protein":26.2,"carbs":16.2},{"name":"Flour, oat, whole grain","fat":6.31,"carbs":69.9,"protein":13.2},{"name":"Flour, potato","fat":0.951,"carbs":79.9,"protein":8.11},{"name":"Peanut butter, creamy","fat":49.4,"protein":24,"carbs":22.7},{"name":"Sesame butter, creamy","fat":62.4,"carbs":14.2,"protein":19.7},{"name":"Almond butter, creamy","fat":53,"carbs":21.2,"protein":20.8},{"name":"Flaxseed, ground","fat":37.3,"carbs":34.4,"protein":18},{"name":"Cottage cheese, full fat, large or small curd","fat":4.22,"protein":11.6,"carbs":4.6},{"name":"Cream cheese, full fat, block","fat":33.5,"carbs":4.56,"protein":5.79},{"name":"Cream, heavy","fat":35.6,"protein":2.02,"carbs":3.8},{"name":"Cream, sour, full fat","fat":18,"protein":3.07,"carbs":5.56},{"name":"Lettuce, iceberg, raw","fat":0.074,"protein":0.742,"carbs":3.37},{"name":"Lettuce, romaine, green, raw","fat":0.071,"protein":0.977,"carbs":4.06},{"name":"Lettuce, leaf, red, raw","fat":0.106,"protein":0.883,"carbs":3.26},{"name":"Lettuce, leaf, green, raw","fat":0.156,"carbs":4.07,"protein":1.09},{"name":"Nuts, pine nuts, raw","fat":61.3,"carbs":18.6,"protein":15.7},{"name":"Nuts, almonds, whole, raw","fat":51.1,"carbs":20,"protein":21.5},{"name":"Nuts, walnuts, English, halves, raw","fat":69.7,"carbs":10.9,"protein":14.6},{"name":"Nuts, pecans, halves, raw","fat":73.3,"carbs":12.7,"protein":9.96},{"name":"Oats, whole grain, rolled, old fashioned","fat":5.89,"carbs":68.7,"protein":13.5},{"name":"Oats, whole grain, steel cut","fat":5.8,"carbs":69.8,"protein":12.5},{"name":"Pineapple, raw","fat":0.211,"carbs":14.1,"protein":0.461},{"name":"Cherries, sweet, dark red, raw","fat":0.192,"protein":1.04,"carbs":16.2},{"name":"Beans, snap, green, raw","fat":0.275,"protein":1.97,"carbs":7.41},{"name":"Potatoes, russet, without skin, raw","fat":0.36,"carbs":17.8,"protein":2.27},{"name":"Potatoes, red, without skin, raw","fat":0.248,"protein":2.06,"carbs":16.3},{"name":"Potatoes, gold, without skin, raw","fat":0.264,"protein":1.81,"carbs":16},{"name":"Sweet potatoes, orange flesh, without skin, raw","fat":0.375,"carbs":17.3,"protein":1.58},{"name":"Celery, raw","fat":0.162,"protein":0.492,"carbs":3.32},{"name":"Cucumber, with peel, raw","fat":0.178,"protein":0.625,"carbs":2.95},{"name":"Cabbage, green, raw","fat":0.228,"protein":0.961,"carbs":6.38},{"name":"Cabbage, red, raw","fat":0.214,"protein":1.24,"carbs":6.79},{"name":"Strawberries, raw","fat":0.22,"carbs":7.96,"protein":0.641},{"name":"Raspberries, raw","fat":0.188,"carbs":12.9,"protein":1.01},{"name":"Blueberries, raw","fat":0.306,"protein":0.703,"carbs":14.6},{"name":"Grapes, red, seedless, raw","fat":0.164,"protein":0.914,"carbs":20.2},{"name":"Grapes, green, seedless, raw","fat":0.232,"protein":0.899,"carbs":18.6},{"name":"Applesauce, unsweetened, with added vitamin C","fat":0.162,"carbs":12.3,"protein":0.273},{"name":"Flour, amaranth","fat":6.24,"protein":13.2,"carbs":68.8},{"name":"Flour, quinoa","fat":6.6,"protein":11.9,"carbs":69.5},{"name":"Flour, sorghum","fat":3.59,"protein":8.27,"carbs":77.4},{"name":"Flour, buckwheat","fat":2.48,"protein":8.88,"carbs":75},{"name":"Flour, rye","fat":1.91,"protein":8.4,"carbs":77.2},{"name":"Flour, barley","fat":2.45,"protein":8.72,"carbs":77.4},{"name":"Flour, cassava","fat":0.494,"protein":0.918,"carbs":87.3},{"name":"Buckwheat, whole grain","fat":3.04,"protein":11.1,"carbs":71.1},{"name":"Millet, whole grain","fat":4.19,"protein":10,"carbs":74.4},{"name":"Rice, brown, long grain, unenriched, raw","fat":3.31,"protein":7.25,"carbs":76.7},{"name":"Rice, white, long grain, unenriched, raw","fat":1.03,"carbs":80.3,"protein":7.04},{"name":"Beef, ground, 90% lean meat / 10% fat, raw","fat":12.8,"protein":18.2,"carbs":0},{"name":"Beef, ground, 80% lean meat / 20% fat, raw","fat":19.4,"protein":17.5,"carbs":0},{"name":"Pork, ground, raw","fat":17.5,"protein":17.8,"carbs":0},{"name":"Chicken, ground, with additives, raw","fat":7.16,"protein":17.9,"carbs":0},{"name":"Turkey, ground, 93% lean/ 7% fat, raw","fat":9.59,"protein":17.3,"carbs":0},{"name":"Nuts, brazilnuts, raw","fat":57.4,"protein":15,"carbs":21.6},{"name":"Nuts, cashew nuts, raw","fat":38.9,"protein":17.4,"carbs":36.3},{"name":"Nuts, hazelnuts or filberts, raw","fat":53.5,"protein":13.5,"carbs":26.5},{"name":"Peanuts, raw","fat":43.3,"protein":23.2,"carbs":26.5},{"name":"Flour, chestnut","fat":4.64,"protein":5.29,"carbs":80.5},{"name":"Nuts, macadamia nuts, raw","fat":64.9,"protein":7.79,"carbs":24.1},{"name":"Nuts, pistachio nuts, raw","fat":45,"protein":20.5,"carbs":27.7},{"name":"Seeds, pumpkin seeds (pepitas), raw","fat":40,"protein":29.9,"carbs":18.7},{"name":"Seeds, sunflower seed, kernel, raw","fat":48.4,"protein":18.9,"carbs":24.5},{"name":"Flour, coconut","fat":15.3,"protein":16.1,"carbs":58.9},{"name":"Beans, cannellini, dry","fat":2.2,"protein":21.6,"carbs":59.8},{"name":"Chickpeas, (garbanzo beans, bengal gram), dry","fat":6.27,"carbs":60.4,"protein":21.3},{"name":"Lentils, dry","fat":1.92,"protein":23.6,"carbs":62.2},{"name":"Blackeye pea, dry","fat":2.42,"protein":21.2,"carbs":61.8},{"name":"Beans, black, canned, sodium added, drained and rinsed","fat":1.27,"protein":6.91,"carbs":19.8},{"name":"Beans, navy, canned, sodium added, drained and rinsed","fat":1.4,"protein":6.57,"carbs":20},{"name":"Beans, cannellini, canned, sodium added, drained and rinsed","fat":1.17,"protein":7.41,"carbs":18.8},{"name":"Chickpeas (garbanzo beans, bengal gram), canned, sodium added, drained and rinsed","fat":3.1,"protein":7.02,"carbs":20.3},{"name":"Beans, kidney, dark red, canned, sodium added, sugar added, drained and rinsed","fat":1.26,"protein":7.8,"carbs":21},{"name":"Beans, kidney, light red, canned, sodium added, sugar added, drained and rinsed","fat":1.3,"protein":7.31,"carbs":21.4},{"name":"Peas, green, sweet, canned, sodium added, sugar added, drained and rinsed","fat":1.15,"protein":4.73,"carbs":12.7},{"name":"Beans, pinto, canned, sodium added, drained and rinsed","fat":1.27,"carbs":19.6,"protein":6.69},{"name":"Blackeye pea, canned, sodium added, drained and rinsed","fat":1.3,"carbs":19.2,"protein":6.92},{"name":"Beans, great northern, canned, sodium added, drained and rinsed","fat":1.27,"carbs":19.3,"protein":7.03},{"name":"Pork, loin, boneless, raw","fat":9.47,"protein":21.1,"carbs":0},{"name":"Pork, loin, tenderloin, boneless, raw","fat":3.9,"protein":21.6,"carbs":0},{"name":"Chicken, breast, boneless, skinless, raw","fat":1.93,"protein":22.5,"carbs":0},{"name":"Chicken, thigh, boneless, skinless, raw","fat":7.92,"protein":18.6,"carbs":0},{"name":"Beef, ribeye, steak, boneless, choice, raw","fat":20,"protein":18.7,"carbs":0},{"name":"Beef, round, top round, boneless, choice, raw","fat":5.7,"protein":21.5,"carbs":0.852},{"name":"Beef, chuck, roast, boneless, choice, raw","fat":17.8,"protein":18.4,"carbs":0},{"name":"Beef, flank, steak, boneless, choice, raw","fat":9.4,"protein":20.1,"carbs":0},{"name":"Yogurt, plain, nonfat","fat":0.087,"protein":4.23,"carbs":8.08},{"name":"Cheese, monterey jack, solid","fat":32.6,"carbs":1.9,"protein":22.6},{"name":"Cheese, pasteurized process cheese food or product, American, singles","fat":23.9,"carbs":8.19,"protein":15.6},{"name":"Cheese, provolone, sliced","fat":28.1,"protein":23.5,"carbs":2.45},{"name":"Cheese, oaxaca, solid","fat":22.1,"carbs":2.4,"protein":22.1},{"name":"Cheese, queso fresco, solid","fat":23.4,"carbs":2.96,"protein":18.9},{"name":"Cheese, cotija, solid","fat":27.2,"protein":23.8,"carbs":2.72},{"name":"Fish, salmon, sockeye, wild caught, raw","fat":4.94,"protein":22.3,"carbs":0},{"name":"Fish, salmon, Atlantic, farm raised, raw","fat":13.1,"protein":20.3,"carbs":0},{"name":"Fish, tilapia, farm raised, raw","fat":2.48,"carbs":0,"protein":19},{"name":"Crustaceans, shrimp, farm raised, raw","fat":0.801,"protein":15.6,"carbs":0.485},{"name":"Fish, cod, Atlantic, wild caught, raw","fat":0.668,"protein":16.1,"carbs":0},{"name":"Fish, catfish, farm raised, raw","fat":7.31,"protein":16.5,"carbs":0},{"name":"Crustaceans, crab, blue swimming, lump, pasteurized, refrigerated","fat":0.808,"carbs":0,"protein":18.6},{"name":"Squash, summer, green, zucchini, includes skin, raw","fat":0.205,"protein":0.984},{"name":"Squash, summer, yellow, includes skin, raw","fat":0.135,"protein":0.891},{"name":"Squash, winter, butternut, raw","fat":0.168,"protein":1.15,"carbs":10.5},{"name":"Squash, winter, acorn, raw","fat":0.182,"protein":1.25,"carbs":10.5},{"name":"Cabbage, bok choy, raw","fat":0.234,"protein":1.02,"carbs":3.51},{"name":"Cauliflower, raw","fat":0.238,"protein":1.64,"carbs":4.72},{"name":"Collards, raw","fat":0.77,"protein":2.97,"carbs":7.02},{"name":"Brussels sprouts, raw","fat":0.565,"protein":3.98,"carbs":9.62},{"name":"Beets, raw","fat":0.302,"carbs":8.79,"protein":1.69},{"name":"Eggplant, raw","fat":0.12,"protein":0.852,"carbs":5.4},{"name":"Tomatoes, whole, canned, solids and liquids, with salt added","fat":0.206,"protein":0.868,"carbs":4.29},{"name":"Tomato, sauce, canned, with salt added","fat":0.382,"protein":1.35,"carbs":6.33},{"name":"Tomato, paste, canned, without salt added","fat":0.732,"protein":4.23,"carbs":20.2},{"name":"Tomatoes, crushed, canned","fat":0.398,"protein":1.44,"carbs":7.14},{"name":"Tomato, puree, canned","fat":0.265,"protein":1.58,"carbs":8.04},{"name":"Apricot, with skin, raw","fat":0.405,"protein":0.961,"carbs":10.2},{"name":"Melons, honeydew, raw","fat":0.216,"protein":0.531,"carbs":8.15},{"name":"Plantains, ripe, raw","fat":0.893,"protein":1.16,"carbs":31},{"name":"Plantains, underripe, raw","fat":0.685,"protein":1.23,"carbs":33.6},{"name":"Chia seeds, dry, raw","fat":32.9,"protein":17,"carbs":38.3},{"name":"Bulgur, dry, raw","fat":2.42,"protein":11.8,"carbs":75.9},{"name":"Wild rice, dry, raw","fat":1.7,"protein":12.8,"carbs":75.7},{"name":"Arugula, baby, raw","fat":0.325,"protein":1.65,"carbs":5.37},{"name":"Asparagus, green, raw","fat":0.216,"protein":1.44,"carbs":5.1},{"name":"Avocado, Hass, peeled, raw","fat":20.3,"protein":1.81,"carbs":8.32},{"name":"Rice, black, unenriched, raw","fat":3.44,"protein":7.57,"carbs":77.2},{"name":"Corn, sweet, yellow and white kernels,  fresh, raw","fat":1.63,"protein":2.79,"carbs":14.7},{"name":"Einkorn, grain, dry, raw","fat":3.81,"protein":15.1,"carbs":68.7},{"name":"Farro, pearled, dry, raw","fat":3.1,"protein":12.6,"carbs":72.1},{"name":"Fonio, grain, dry, raw","fat":1.69,"protein":7.17,"carbs":81.3},{"name":"Khorasan, grain, dry, raw","fat":2.8,"protein":14.8,"carbs":71.8},{"name":"Kiwifruit (kiwi), green, peeled, raw","fat":0.64,"protein":1.01,"carbs":13.8},{"name":"Mandarin, seedless, peeled, raw","fat":0.458,"protein":1.04,"carbs":13.4},{"name":"Mango, Tommy Atkins, peeled, raw","fat":0.572,"protein":0.562,"carbs":15.3},{"name":"Mango, Ataulfo, peeled, raw","fat":0.681,"protein":0.688,"carbs":17.4},{"name":"Corn flour, masa harina, white or yellow, dry, raw","fat":4.34,"protein":7.56,"carbs":76.7},{"name":"Pear, Anjou, green, with skin, raw","fat":0.371,"protein":0.312,"carbs":14.8},{"name":"Plum, black, with skin, raw","fat":0.282,"protein":0.578,"carbs":13.5},{"name":"Rice, red, unenriched, dry, raw","fat":3.44,"protein":8.56,"carbs":76.2},{"name":"Sorghum bran, white, unenriched, dry, raw","fat":9.26,"protein":11.2,"carbs":68.7},{"name":"Sorghum flour, white, pearled, unenriched, dry, raw","fat":3.24,"protein":10.2,"carbs":73.5},{"name":"Sorghum grain, white, pearled, unenriched, dry, raw","fat":3.26,"protein":10.2,"carbs":74.9},{"name":"Sorghum, whole grain, white, dry, raw","fat":4.22,"carbs":73.6,"protein":10.1},{"name":"Plantains, overripe, raw","fat":0.99,"protein":1.17,"carbs":29.2}]

*/

let database = [];
getDb().then(db => {
    database = db

});


async function getDb() {
    const response = await fetch("/database", {
        method: "GET",
        headers: {
                'Content-Type': 'application/json'
        }
    });
    if (response.status === 200)
        return response.json();
    else throw response.status;

}
