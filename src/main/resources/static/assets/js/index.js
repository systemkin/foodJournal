let loggedIn = false;
let timeOffset = new Date().getTimezoneOffset()/(-60)
let craftingMeal = []
let menuState = false;
let userIncomes = [];
let userGoals = {protein:-1, fat:-1, carbs:-1};

modalWindows = ["account", "mainWindow", "menu", "plate", "favorites", "results", "goals", "ai"];
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
async function generate() {
    const response =  await fetch("https://api.ai21.com/studio/v1/chat/completions", {
    	method: "POST",
    	headers: {
    		"Authorization": "Bearer TOKEN",
    		"Content-Type": "application/json",
    	},
    	body: JSON.stringify({
    		"model": "jamba-1.5-large",
    		"messages": [
    		{
    			"role": "user",
    			"content": "You are a marketing expert with great writing skills. Can you take this email draft and improve it?\n\nI want it to look professional and be engaging and fun. This will be sent to our user-base mailing list\n\n&nbsp;\n\nSubject: New languages in Socialll\n\n&nbsp;\n\nHi there,\n\n&nbsp;\n\nI just wanted to let you know that we added some new languages to Socialll. Now it supports German, Swedish, and Korean. We worked hard on this, so I hope you find it useful.\n\n&nbsp;\n\nIf you have users who speak those languages, they can now use our tool in their native language. It should make things easier for them. I think that's it. Let me know if there are any problems.",
    		}],
    		"documents":[],
    		"tools":[],
    		"n": 1,
    		"max_tokens": 2048,
    		"temperature": 0.4,
    		"top_p": 1,
    		"stop": [],
    		"response_format":{"type": "text"},
    	}),
    });
    const json = await response.json();
    return json;

}
/*
generate().then((res) => {
    console.log(res);
})
*/
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
async function getMotivationalMessage() {
    var url = "https://api.ai21.com/studio/v1/chat/completions";
    var bearer = 'Bearer ' + "Hzcd0ZnTn7QvMBGaxw0v8wLQ7nb1nICF";
    fetch(url, {
            method: 'POST',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Authorization': bearer,
                'Content-Type': 'application/json'
            },
            body: `{"model":"jamba-1.5-mini","messages":[{"role":"user", "content":"Make a short motivationsl message to keep a food plan"}]}`
        }).then(responseJson => {
            var items = JSON.parse(responseJson._bodyInit);
        })
        .catch(error => this.setState({
            isLoading: false,
            message: 'Something bad happened ' + error
        }));
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
